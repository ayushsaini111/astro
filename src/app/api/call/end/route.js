// backend/src/app/api/call/end/route.js

import { prisma } from "@/lib/prisma";
import { sendEvent } from "@/lib/sse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

const FREE_CALL_SECONDS = 5;

export async function POST(req) {
  try {
    // ─── Auth ────────────────────────────────────────────────────────────────
    let userId = req.headers.get("x-user-id");

    if (!userId) {
      const cookieStore = await cookies();
      userId = cookieStore.get("userId")?.value;
    }

    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId, clientDuration } = await req.json();

    if (!callId) {
      return Response.json({ error: "Missing callId" }, { status: 400 });
    }

    console.log("📞 Ending call:", { callId, userId, clientDuration });

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        user: { select: { id: true } },
        pandit: { select: { id: true } },
      },
    });

    if (!call) {
      console.warn("⚠️ Call not found (already ended?):", callId);
      return Response.json({ message: "Call already ended" });
    }

    // If already completed, skip
    if (call.status === "COMPLETED" || call.status === "FAILED") {
      console.warn("⚠️ Call already ended:", callId);
      return Response.json({ message: "Call already ended" });
    }

    const now = new Date();
    const startTime = call.startTime ? new Date(call.startTime) : now;
    const serverDuration = Math.floor((now - startTime) / 1000);

    // ✅ Use the LONGER of client/server duration for accuracy
    const actualDuration = Math.max(serverDuration, clientDuration || 0);

    console.log("⏱️ Call duration:", {
      clientDuration,
      serverDuration,
      actualDuration,
      isFreeCall: call.isFreeCall,
    });

    // ─── Update call record ──────────────────────────────────────────────────
    await prisma.call.update({
      where: { id: callId },
      data: {
        status: "COMPLETED",
        endTime: now,
        duration: actualDuration,
        endedBy: userId,
        billableSeconds: actualDuration,
      },
    });

    // ─── Handle free call ────────────────────────────────────────────────────
    if (call.isFreeCall && call.userId) {
      const freeSeconds = Math.min(actualDuration, FREE_CALL_SECONDS);
      const paidSeconds = Math.max(0, actualDuration - FREE_CALL_SECONDS);

      // Mark free call as used
      await prisma.freeCallUsage.upsert({
        where: { userId: call.userId },
        create: { userId: call.userId, callId: call.id },
        update: { callId: call.id },
      });

      console.log(`🎁 Free call used: ${freeSeconds}s free, ${paidSeconds}s paid`);

      // If there's overage, deduct from plans
      if (paidSeconds > 0) {
        await deductFromPlans(call.userId, paidSeconds);
      }

      return Response.json({
        message: "Call ended",
        duration: actualDuration,
        freeSeconds,
        paidSeconds,
      });
    }

    // ─── Deduct from user plans ──────────────────────────────────────────────
    if (call.userId && actualDuration > 0) {
      await deductFromPlans(call.userId, actualDuration);
    }

    // ─── Notify both sides immediately ───────────────────────────────────────
    console.log("📣 Sending call-ended events to both parties");

    if (call.userId) {
      sendEvent(`user-${call.userId}`, "call-ended", { callId: call.id });
    }

    if (call.panditId) {
      sendEvent(`pandit-${call.panditId}`, "call-ended", { callId: call.id });
    }

    console.log("✅ Call ended successfully");

    return Response.json({
      message: "Call ended",
      duration: actualDuration,
    });
  } catch (err) {
    console.error("❌ End call error:", err.message, err.stack);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── Helper: Deduct seconds from user plans ──────────────────────────────────
async function deductFromPlans(userId, totalSeconds) {
  const now = new Date();
  const today = now.toDateString();

  let remainingToDeduct = totalSeconds;

  const activePlans = await prisma.userPlan.findMany({
    where: {
      userId,
      isActive: true,
      remainingSeconds: { gt: 0 },
      endDate: { gte: now },
    },
    orderBy: { endDate: "asc" }, // Use plans expiring soonest first
    include: {
      plan: { select: { perDayLimit: true } },
    },
  });

  for (const userPlan of activePlans) {
    if (remainingToDeduct <= 0) break;

    const plan = userPlan.plan;
    let availableSeconds = userPlan.remainingSeconds;

    // ✅ Check daily limit
    if (plan.perDayLimit) {
      const lastUsed = userPlan.lastUsedDate
        ? new Date(userPlan.lastUsedDate).toDateString()
        : null;

      const isToday = lastUsed === today;
      const dailyUsed = isToday ? userPlan.perDayUsedSeconds || 0 : 0;
      const dailyRemaining = plan.perDayLimit - dailyUsed;

      availableSeconds = Math.min(availableSeconds, dailyRemaining);
    }

    const toDeduct = Math.min(availableSeconds, remainingToDeduct);

    if (toDeduct > 0) {
      const lastUsed = userPlan.lastUsedDate
        ? new Date(userPlan.lastUsedDate).toDateString()
        : null;
      const isToday = lastUsed === today;

      await prisma.userPlan.update({
        where: { id: userPlan.id },
        data: {
          remainingSeconds: { decrement: toDeduct },
          perDayUsedSeconds: isToday
            ? { increment: toDeduct }
            : toDeduct,
          lastUsedDate: now,
          isActive: userPlan.remainingSeconds - toDeduct > 0,
        },
      });

      console.log(`⬇️ Deducted ${toDeduct}s from plan ${userPlan.id} (${userPlan.remainingSeconds - toDeduct}s left)`);
      remainingToDeduct -= toDeduct;
    }
  }

  if (remainingToDeduct > 0) {
    console.warn(`⚠️ Could not deduct ${remainingToDeduct}s - insufficient balance!`);
  }
}
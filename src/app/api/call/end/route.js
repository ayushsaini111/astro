import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEvent } from "@/lib/sse";

const FREE_CALL_SECONDS = 5;

export async function POST(req) {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  const session = await getServerSession(authOptions);
  if (!userId) userId = session?.user?.id;

  let isPandit = false;
  if (!userId && session?.user?.email) {
    const pandit = await prisma.pandit.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (pandit) { isPandit = true; userId = pandit.id; }
  }

  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { callId, clientDuration } = await req.json();

  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { id: true, userId: true, panditId: true, isFreeCall: true, startTime: true, createdAt: true, status: true },
  });
  if (!call) return Response.json({ error: "Call not found" }, { status: 404 });

  // Already ended — prevent double processing
  if (call.status === "COMPLETED") return Response.json({ success: true });

  const now = new Date();
  const durationSeconds = typeof clientDuration === "number" && clientDuration >= 0
    ? clientDuration
    : Math.floor((now - (call.startTime ?? call.createdAt)) / 1000);

  if (isPandit) {
    await prisma.call.update({
      where: { id: callId },
      data: { status: "COMPLETED", endTime: now, duration: durationSeconds, billableSeconds: 0, totalCost: 0, endedBy: userId },
    });
    sendEvent(`user-${call.userId}`, "call-ended", { callId, status: "COMPLETED" });
    sendEvent(`pandit-${call.panditId}`, "call-ended", { callId, status: "COMPLETED" });
    return Response.json({ success: true, duration: durationSeconds });
  }

  let secondsDeducted = 0;
  let freeSecondsUsed = 0;
  let paidSecondsUsed = 0;

  // =========================================================
  // ACCURATE MULTI-PLAN DEDUCTION
  // Walks through every active plan (soonest-expiring first) and
  // draws from each in turn until the full duration is accounted
  // for. Previously this only deducted from a single plan and
  // silently dropped any overflow seconds if that plan ran out
  // mid-call — undercharging the user.
  // =========================================================

  async function deductSeconds(totalSeconds) {
    if (totalSeconds <= 0) return 0;

    let remainingToDeduct = totalSeconds;
    let totalDeducted = 0;

    const activePlans = await prisma.userPlan.findMany({
      where: { userId: call.userId, isActive: true, endDate: { gte: now }, remainingSeconds: { gt: 0 } },
      orderBy: { endDate: "asc" },
    });

    for (const plan of activePlans) {
      if (remainingToDeduct <= 0) break;

      const toDeduct = Math.min(remainingToDeduct, plan.remainingSeconds);
      if (toDeduct <= 0) continue;

      await prisma.userPlan.update({
        where: { id: plan.id },
        data: {
          remainingSeconds: { decrement: toDeduct },
          perDayUsedSeconds: { increment: toDeduct },
          lastUsedDate: now,
        },
      });

      totalDeducted += toDeduct;
      remainingToDeduct -= toDeduct;
    }

    return totalDeducted;
  }

  if (call.isFreeCall) {
    if (durationSeconds <= FREE_CALL_SECONDS) {
      freeSecondsUsed = durationSeconds;
    } else {
      freeSecondsUsed = FREE_CALL_SECONDS;
      paidSecondsUsed = durationSeconds - FREE_CALL_SECONDS;
    }
    await prisma.freeCallUsage.upsert({
      where: { userId: call.userId },
      update: {},
      create: { userId: call.userId, callId, usedAt: now },
    });
    if (paidSecondsUsed > 0) secondsDeducted = await deductSeconds(paidSecondsUsed);
  } else {
    secondsDeducted = await deductSeconds(durationSeconds);
  }

  await prisma.call.update({
    where: { id: callId },
    data: { status: "COMPLETED", endTime: now, duration: durationSeconds, billableSeconds: secondsDeducted + freeSecondsUsed, totalCost: 0, endedBy: userId },
  });

  // ✅ Notify both sides
  sendEvent(`user-${call.userId}`, "call-ended", { callId, status: "COMPLETED" });
  sendEvent(`pandit-${call.panditId}`, "call-ended", { callId, status: "COMPLETED" });

  return Response.json({ success: true, duration: durationSeconds, freeSecondsUsed, paidSecondsUsed, secondsDeducted });
}
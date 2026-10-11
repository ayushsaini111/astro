import { prisma } from "./prisma";
import { sendEvent } from "./sse";
import { FREE_CALL_SECONDS } from "./freeCall";

/**
 * Single source of truth for ending + billing a call.
 * Used by BOTH /api/call/end (user app) and /api/mobile/end-call (pandit app).
 * The atomic updateMany() below is what prevents double-billing when
 * both sides hit "end" around the same moment.
 */
export async function endCallAndBill({ callId, endedBy, clientDuration }) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { id: true, userId: true, panditId: true, status: true, startTime: true, isFreeCall: true },
  });

  if (!call) return { alreadyEnded: true, message: "Call not found" };
  if (call.status === "COMPLETED" || call.status === "FAILED") {
    return { alreadyEnded: true, message: "Call already ended" };
  }

  const now = new Date();
  const startTime = call.startTime ? new Date(call.startTime) : now;
  const serverDuration = Math.floor((now - startTime) / 1000);

  const safeClientDuration =
    typeof clientDuration === "number" && clientDuration >= 0 && Number.isFinite(clientDuration)
      ? Math.floor(clientDuration)
      : null;

  const actualDuration = safeClientDuration ?? serverDuration;

  // ✅ ATOMIC CLAIM — only one of (user-end, pandit-end, auto-timer-end) wins.
  const claim = await prisma.call.updateMany({
    where: { id: callId, status: { notIn: ["COMPLETED", "FAILED"] } },
    data: {
      status: "COMPLETED",
      endTime: now,
      duration: actualDuration,
      endedBy,
      billableSeconds: actualDuration,
    },
  });

  if (claim.count === 0) {
    console.log("⚠️ Duplicate end-call request ignored for:", callId);
    return { alreadyEnded: true, message: "Call already ended" };
  }

  let freeSeconds = 0;
  let paidSeconds = actualDuration;

  if (call.isFreeCall && call.userId) {
    freeSeconds = Math.min(actualDuration, FREE_CALL_SECONDS);
    paidSeconds = Math.max(0, actualDuration - FREE_CALL_SECONDS);

    await prisma.freeCallUsage.upsert({
      where: { userId: call.userId },
      create: { userId: call.userId, callId: call.id },
      update: { callId: call.id },
    });
  }

  if (call.userId && paidSeconds > 0) {
    await deductFromPlans(call.userId, paidSeconds);
  }

  if (call.userId) sendEvent(`user-${call.userId}`, "call-ended", { callId: call.id, status: "COMPLETED" });
  if (call.panditId) sendEvent(`pandit-${call.panditId}`, "call-ended", { callId: call.id, status: "COMPLETED" });

  console.log("⏱️ Call ended:", { callId, actualDuration, freeSeconds, paidSeconds, endedBy });

  return { alreadyEnded: false, duration: actualDuration, freeSeconds, paidSeconds };
}

async function deductFromPlans(userId, totalSeconds) {
  const now = new Date();
  const today = now.toDateString();
  let remainingToDeduct = totalSeconds;

  const activePlans = await prisma.userPlan.findMany({
    where: { userId, isActive: true, remainingSeconds: { gt: 0 }, endDate: { gte: now } },
    orderBy: { endDate: "asc" },
    include: { plan: { select: { perDayLimit: true } } },
  });

  for (const userPlan of activePlans) {
    if (remainingToDeduct <= 0) break;
    const plan = userPlan.plan;
    let availableSeconds = userPlan.remainingSeconds;

    if (plan.perDayLimit) {
      const lastUsed = userPlan.lastUsedDate ? new Date(userPlan.lastUsedDate).toDateString() : null;
      const isToday = lastUsed === today;
      const dailyUsed = isToday ? userPlan.perDayUsedSeconds || 0 : 0;
      availableSeconds = Math.min(availableSeconds, plan.perDayLimit - dailyUsed);
    }

    const toDeduct = Math.min(availableSeconds, remainingToDeduct);
    if (toDeduct > 0) {
      const lastUsed = userPlan.lastUsedDate ? new Date(userPlan.lastUsedDate).toDateString() : null;
      const isToday = lastUsed === today;

      await prisma.userPlan.update({
        where: { id: userPlan.id },
        data: {
          remainingSeconds: { decrement: toDeduct },
          perDayUsedSeconds: isToday ? { increment: toDeduct } : toDeduct,
          lastUsedDate: now,
          isActive: userPlan.remainingSeconds - toDeduct > 0,
        },
      });
      remainingToDeduct -= toDeduct;
    }
  }

  if (remainingToDeduct > 0) {
    console.warn(`⚠️ Could not deduct ${remainingToDeduct}s — insufficient balance for user ${userId}`);
  }
}
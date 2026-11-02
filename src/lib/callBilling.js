import { after } from "next/server";
import { prisma } from "./prisma";
import { sendEvent } from "./sse";
import { FREE_CALL_SECONDS } from "./freeCall";
import { RATE_PER_SECOND } from "./pricing";
import { pushToUser } from "./pushToUser";
import { pushToPandit } from "./pushToPandit";
import { stopCallRecording } from "./agoraRecording";

export async function endCallAndBill({ callId, endedBy, clientDuration }) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      id: true, userId: true, panditId: true, status: true,
      startTime: true, isFreeCall: true, channelName: true,
    },
  });

  if (!call) return { alreadyEnded: true, message: "Call not found" };
  if (call.status === "COMPLETED" || call.status === "FAILED") {
    return { alreadyEnded: true, message: "Call already ended" };
  }

  const now = new Date();
  const serverDuration = Math.floor((now - (call.startTime ? new Date(call.startTime) : now)) / 1000);
  const actualDuration =
    typeof clientDuration === "number" && clientDuration >= 0 && Number.isFinite(clientDuration)
      ? Math.floor(clientDuration)
      : serverDuration;

  const claim = await prisma.call.updateMany({
    where: { id: callId, status: { notIn: ["COMPLETED", "FAILED"] } },
    data: {
      status: "COMPLETED",
      endTime: now,
      duration: actualDuration,
      endedBy,
      billableSeconds: actualDuration,
      totalCost: Math.round(actualDuration * RATE_PER_SECOND * 100) / 100,
    },
  });

  if (claim.count === 0) {
    console.log("⚠️ Duplicate end-call ignored:", callId);
    return { alreadyEnded: true, message: "Call already ended" };
  }

  // 1. SSE to both sides
  if (call.userId) sendEvent(`user-${call.userId}`, "call-ended", { callId: call.id, status: "COMPLETED" });
  if (call.panditId) sendEvent(`pandit-${call.panditId}`, "call-ended", { callId: call.id, status: "COMPLETED" });

  // 2. stop recorder NOW (before push/billing) so audio ends with the call
  const stopP = call.channelName
    ? stopCallRecording(call.id, call.channelName).catch((e) =>
        console.error("🔴 stopCallRecording failed:", e.message)
      )
    : Promise.resolve();
  after(() => stopP); // keeps it alive after the response on Vercel

  // 3. push + billing in parallel
  const pushP = Promise.allSettled([
    call.userId && endedBy !== call.userId
      ? pushToUser(call.userId, { type: "call_ended", data: { callId: call.id } })
      : null,
    call.panditId && endedBy !== call.panditId
      ? pushToPandit(call.panditId, { type: "call_ended", data: { callId: call.id } })
      : null,
  ]);

  let freeSeconds = 0;
  let paidSeconds = actualDuration;

  const billP = (async () => {
    if (call.isFreeCall && call.userId) {
      freeSeconds = Math.min(actualDuration, FREE_CALL_SECONDS);
      paidSeconds = Math.max(0, actualDuration - FREE_CALL_SECONDS);
      await prisma.freeCallUsage.upsert({
        where: { userId: call.userId },
        create: { userId: call.userId, callId: call.id },
        update: { callId: call.id },
      });
    }
    if (call.userId && paidSeconds > 0) await deductFromPlans(call.userId, paidSeconds);
  })();

  await Promise.all([pushP, billP]);

  console.log("⏱️ Call ended:", { callId, actualDuration, freeSeconds, paidSeconds, endedBy });
  return { alreadyEnded: false, duration: actualDuration, freeSeconds, paidSeconds };
}

async function deductFromPlans(userId, totalSeconds) {
  const now = new Date();
  const today = now.toDateString();
  let remaining = totalSeconds;

  const plans = await prisma.userPlan.findMany({
    where: { userId, isActive: true, remainingSeconds: { gt: 0 }, endDate: { gte: now } },
    orderBy: { endDate: "asc" },
    include: { plan: { select: { perDayLimit: true } } },
  });

  for (const up of plans) {
    if (remaining <= 0) break;
    const isToday = up.lastUsedDate && new Date(up.lastUsedDate).toDateString() === today;
    let available = up.remainingSeconds;

    if (up.plan.perDayLimit) {
      const dailyUsed = isToday ? up.perDayUsedSeconds || 0 : 0;
      available = Math.min(available, up.plan.perDayLimit - dailyUsed);
    }

    const take = Math.min(available, remaining);
    if (take <= 0) continue;

    await prisma.userPlan.update({
      where: { id: up.id },
      data: {
        remainingSeconds: { decrement: take },
        perDayUsedSeconds: isToday ? { increment: take } : take,
        lastUsedDate: now,
        isActive: up.remainingSeconds - take > 0,
      },
    });
    remaining -= take;
  }

  if (remaining > 0) console.warn(`⚠️ Could not deduct ${remaining}s for user ${userId}`);
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { callId } = await req.json();

  const call = await prisma.call.findUnique({ where: { id: callId } });

  if (!call || call.status === "COMPLETED") {
    return NextResponse.json({ error: "Invalid call" }, { status: 400 });
  }

  const endTime = new Date();
  const startTime = call.startTime || call.createdAt;
  const durationSeconds = Math.floor((endTime - startTime) / 1000);
  const billableMinutes = Math.ceil(durationSeconds / 60);

  const userPlan = await prisma.userPlan.findFirst({
    where: {
      userId,
      endDate: { gte: new Date() },
      remainingMinutes: { gt: 0 },
    },
    orderBy: { endDate: "asc" },
  });

  const minutesDeducted = Math.min(
    billableMinutes,
    userPlan?.remainingMinutes ?? 0
  );

  await prisma.$transaction([
    prisma.call.update({
      where: { id: callId },
      data: {
        status: "COMPLETED",
        endTime,
        duration: durationSeconds,
        billableSeconds: minutesDeducted * 60,
        totalCost: 0,
        endedBy: userId,
      },
    }),
    ...(userPlan
      ? [
          prisma.userPlan.update({
            where: { id: userPlan.id },
            data: { remainingMinutes: { decrement: minutesDeducted } },
          }),
        ]
      : []),
    prisma.callBilling.create({
      data: {
        callId,
        totalDuration: durationSeconds,
        chargedDuration: minutesDeducted * 60,
        totalCost: 0,
        planUsedMinutes: minutesDeducted,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    duration: durationSeconds,
    minutesDeducted,
    remainingMinutes: (userPlan?.remainingMinutes ?? 0) - minutesDeducted,
  });
}
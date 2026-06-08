import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEvent } from "@/lib/sse";

const FREE_CALL_SECONDS = 5;

export async function POST(req) {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { panditId } = await req.json();

  const now = new Date();
  const today = new Date(now.toDateString());

  const [user, freeUsage, activePlan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { username: true, dob: true } }),
    prisma.freeCallUsage.findUnique({ where: { userId } }),
    prisma.userPlan.findFirst({
      where: { userId, isActive: true, endDate: { gte: now }, remainingSeconds: { gt: 0 } },
      select: {
        id: true,
        remainingSeconds: true,
        perDayUsedSeconds: true,
        lastUsedDate: true,
        plan: { select: { planType: true, perDayLimit: true } },
      },
      orderBy: { endDate: "asc" },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  // DOB condition removed — only username is required
  if (!user.username) return NextResponse.json({ error: "INCOMPLETE_PROFILE" }, { status: 403 });

  const hasFreeCall = !freeUsage;
  if (!hasFreeCall && !activePlan) {
    return NextResponse.json({ error: "NO_BALANCE", message: "Buy a plan to continue calling" }, { status: 403 });
  }

  if (!hasFreeCall && activePlan?.plan.planType === "TOPUP") {
    const lastUsedDate = activePlan.lastUsedDate
      ? new Date(activePlan.lastUsedDate.toDateString())
      : null;

    const isNewDay = !lastUsedDate || lastUsedDate < today;
    if (isNewDay && activePlan.perDayUsedSeconds > 0) {
      await prisma.userPlan.update({
        where: { id: activePlan.id },
        data: { perDayUsedSeconds: 0, lastUsedDate: null },
      });
      activePlan.perDayUsedSeconds = 0;
    }

    const dailyUsed = isNewDay ? 0 : activePlan.perDayUsedSeconds;
    const dailyLeft = (activePlan.plan.perDayLimit ?? 0) - dailyUsed;

    if (dailyLeft <= 0) {
      return NextResponse.json({
        error: "DAILY_LIMIT_REACHED",
        message: "You have used your daily minutes. Come back tomorrow!",
      }, { status: 403 });
    }
  }

  await prisma.call.updateMany({
    where: { userId, panditId, status: "INITIATED" },
    data: { status: "FAILED" },
  });

  const channelName = `ch${randomBytes(8).toString("hex")}`;
  const uid = Math.floor(Math.random() * 100000);
  const token = generateAgoraToken(channelName, uid);

  const call = await prisma.call.create({
    data: {
      userId, panditId, channelName, agoraToken: token,
      type: "VOICE", billingType: hasFreeCall ? "FREE" : "PLAN",
      ratePerMinute: 0, status: "INITIATED", isFreeCall: hasFreeCall,
    },
  });

  sendEvent(`pandit-${panditId}`, "incoming-call", {
    callId: call.id,
    user: { username: user.username, dob: user.dob },
    createdAt: call.createdAt,
  });

  return NextResponse.json({
    callId: call.id,
    channelName,
    token,
    appId: process.env.AGORA_APP_ID,
    uid,
    isFreeCall: hasFreeCall,
    freeSeconds: hasFreeCall ? FREE_CALL_SECONDS : 0,
    planSecondsLeft: activePlan?.remainingSeconds ?? 0,
  });
}
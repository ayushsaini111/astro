import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEvent } from "@/lib/sse";
import { messaging } from "@/lib/firebaseAdmin";

const FREE_CALL_SECONDS = 5;

export async function POST(req) {
  const body = await req.json();

  let userId = req.headers.get("x-user-id");

  if (!userId) {
    const cookieStore = await cookies();
    userId = cookieStore.get("userId")?.value;
  }

  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }

  if (!userId) userId = body.userId;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { panditId } = body;

  if (!panditId) return NextResponse.json({ error: "Missing panditId" }, { status: 400 });

  const now = new Date();
  const today = new Date(now.toDateString());

  const [user, freeUsage, activePlan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true, dob: true, fcmToken: true }, // ✅ ADD fcmToken
    }),
    prisma.freeCallUsage.findUnique({ where: { userId } }),
    prisma.userPlan.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gte: now },
        remainingSeconds: { gt: 0 },
      },
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

  if (!user.name) {
    return NextResponse.json({ error: "INCOMPLETE_PROFILE" }, { status: 403 });
  }

  const hasFreeCall = !freeUsage && !activePlan;
  if (!hasFreeCall && !activePlan) {
    return NextResponse.json(
      { error: "NO_BALANCE", message: "Buy a plan to continue calling" },
      { status: 403 }
    );
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
      return NextResponse.json(
        {
          error: "DAILY_LIMIT_REACHED",
          message: "You have used your daily minutes. Come back tomorrow!",
        },
        { status: 403 }
      );
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
      userId,
      panditId,
      channelName,
      agoraToken: token,
      type: "VOICE",
      billingType: hasFreeCall ? "FREE" : "PLAN",
      ratePerMinute: 0,
      status: "INITIATED",
      isFreeCall: hasFreeCall,
    },
  });

  // ✅ Notify pandit via SSE
  sendEvent(`pandit-${panditId}`, "incoming-call", {
    callId: call.id,
    user: { name: user.name, username: user.username, dob: user.dob },
    createdAt: call.createdAt,
  });

  // ✅ Send FCM to USER so call shows even if app is killed
  if (user?.fcmToken) {
    try {
      await messaging.send({
        token: user.fcmToken,
        data: {
          type:        'incoming_call',
          callId:      call.id,
          channelName: channelName,
          token:       token,
          appId:       process.env.AGORA_APP_ID,
          uid:         String(uid),
          callerName:  'Spiritual Expert',
          panditName:  'Spiritual Expert',
        },
        android: {
          priority: 'high',
          ttl:      30000,
        },
        apns: {
          payload: {
            aps: { contentAvailable: true },
          },
          headers: {
            'apns-priority': '5',
          },
        },
      });
      console.log('✅ FCM sent to user:', user.name);
    } catch (err) {
      console.error('❌ FCM to user failed:', err.message);
    }
  } else {
    console.log('❌ No FCM token for user:', user.name);
  }

  // Fetch pandit for FCM to pandit
  const pandit = await prisma.pandit.findUnique({
    where: { id: panditId },
    select: { fcmToken: true, name: true },
  });

  // ✅ Send FCM to PANDIT
  if (pandit?.fcmToken) {
    try {
      await messaging.send({
        token: pandit.fcmToken,
        notification: {
          title: "New Consultation Request",
          body: `${user.name} wants to consult you.`,
        },
        android: {
          priority: "high",
          notification: {
            channelId: "default",
            sound: "default",
          },
        },
        apns: {
          payload: {
            aps: { sound: "default" },
          },
        },
      });
      console.log('✅ FCM sent to pandit:', pandit.name);
    } catch (err) {
      console.error("❌ FCM to pandit failed:", err?.message);
    }
  }

  return NextResponse.json({
    callId:          call.id,
    channelName,
    token,
    appId:           process.env.AGORA_APP_ID,
    uid,
    isFreeCall:      hasFreeCall,
    freeSeconds:     hasFreeCall ? FREE_CALL_SECONDS : 0,
    planSecondsLeft: activePlan?.remainingSeconds ?? 0,
  });
}
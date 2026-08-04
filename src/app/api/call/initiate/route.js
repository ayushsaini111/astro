// backend/src/app/api/call/initiate/route.js
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

  // 1. Try header first (forwarded by frontend proxy)
  let userId = req.headers.get("x-user-id");

  // 2. Fallback: cookie
  if (!userId) {
    const cookieStore = await cookies();
    userId = cookieStore.get("userId")?.value;
  }

  // 3. Fallback: session
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }

  // 4. Fallback: body (legacy)
  if (!userId) userId = body.userId;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { panditId } = body;

  if (!panditId) return NextResponse.json({ error: "Missing panditId" }, { status: 400 });

  const now = new Date();
  const today = new Date(now.toDateString());

  const [user, freeUsage, activePlan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      // ✅ Select name (not username) — name is what's required
      select: { name: true, username: true, dob: true },
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

  // ✅ Only name is required — username and DOB are optional
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

  // Daily limit check for TOPUP plans
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

  // Cancel any stale INITIATED calls for this user+pandit pair
  await prisma.call.updateMany({
    where: { userId, panditId, status: "INITIATED" },
    data: { status: "FAILED" },
  });

  // Create Agora channel
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

  // Notify pandit via SSE
  sendEvent(`pandit-${panditId}`, "incoming-call", {
    callId: call.id,
    user: { name: user.name, username: user.username, dob: user.dob },
    createdAt: call.createdAt,
  });

  // Fetch pandit for FCM
  const pandit = await prisma.pandit.findUnique({
    where: { id: panditId },
    select: { fcmToken: true, name: true },
  });

  console.log("=================================");
  console.log("Pandit:", pandit?.name);
  console.log("FCM Token:", pandit?.fcmToken);
  console.log("=================================");

  // Send FCM push notification
  if (pandit?.fcmToken) {
    try {
      console.log("🔥 Sending FCM Notification...");

      // ✅ Capture the response (was missing before, causing ReferenceError)
      const fcmResponse = await messaging.send({
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
            aps: {
              sound: "default",
            },
          },
        },
      });

      console.log("✅ FCM Sent:", fcmResponse);
    } catch (err) {
      // ✅ Non-fatal — log and continue so the call still goes through
      console.error("❌ FCM Failed:", err?.message || err);
    }
  } else {
    console.log("❌ No FCM token found for pandit:", pandit?.name);
  }

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
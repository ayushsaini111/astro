// app/api/mobile/accept-call/route.js
import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEvent } from "@/lib/sse";
import { messaging } from "@/lib/firebaseAdmin";          // ✅ ADD
import { FREE_CALL_SECONDS } from "@/lib/freeCall";        // ✅ ADD (see below)

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = auth.replace("Bearer ", "");
    let payload;
    try { payload = jwt.verify(token, process.env.NEXTAUTH_SECRET); }
    catch { return NextResponse.json({ error: "Invalid token" }, { status: 401 }); }

    const pandit = await prisma.pandit.findUnique({ where: { id: payload.id } });
    if (!pandit) return NextResponse.json({ error: "Pandit not found" }, { status: 404 });

    const { callId } = await req.json();
    if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { user: { select: { name: true, dob: true, fcmToken: true } } }, // ✅ ADD fcmToken
    });
    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });

    if (call.status === "ONGOING" || call.status === "COMPLETED") {
      return NextResponse.json({ error: "Call already accepted" }, { status: 400 });
    }

    const uid = Math.floor(Math.random() * 100000);
    const agoraToken = generateAgoraToken(call.channelName, uid);
    const now = new Date();

    await prisma.call.update({
      where: { id: call.id },
      data: { status: "RINGING", agoraToken, startTime: now },
    });

    const userPlans = await prisma.userPlan.findMany({
      where: { userId: call.userId, isActive: true, remainingSeconds: { gt: 0 }, endDate: { gte: now } },
      orderBy: { endDate: "asc" },
    });
    const totalPlanSeconds = userPlans.reduce((sum, p) => sum + p.remainingSeconds, 0);

    const freeCallUsage = await prisma.freeCallUsage.findUnique({ where: { userId: call.userId } });
    const isFreeCall = !freeCallUsage && !!call.isFreeCall && userPlans.length === 0;

    const userPayload = {
      callId: call.id,
      channelName: call.channelName,
      token: agoraToken,
      uid,
      appId: process.env.AGORA_APP_ID,
      pandit: { name: pandit.name, speciality: pandit.speciality, profilePic: pandit.profilePic },
    };

    // ✅ SSE — instant if app is foregrounded and SSE is live
    sendEvent(`user-${call.userId}`, "call-ringing", userPayload);

    // ✅ FCM — THE FIX. Works even if SSE dropped/reconnecting/backgrounded/killed.
    if (call.user?.fcmToken) {
      try {
        await messaging.send({
          token: call.user.fcmToken,
          data: {
            type: "incoming_call",
            callId: call.id,
            channelName: call.channelName,
            token: agoraToken,
            appId: process.env.AGORA_APP_ID,
            uid: String(uid),
            callerName: pandit.name || "Expert",
            panditName: pandit.name || "Expert",
          },
          android: { priority: "high", ttl: 30000 },
          apns: { payload: { aps: { contentAvailable: true } }, headers: { "apns-priority": "10" } },
        });
        console.log("✅ FCM sent to user on mobile-accept:", call.user.username);
      } catch (err) {
        console.error("❌ FCM to user failed (mobile-accept):", err.message);
      }
    } else {
      console.log("❌ No FCM token for user on mobile-accept");
    }

    return NextResponse.json({
      success: true,
      callId: call.id,
      channelName: call.channelName,
      token: agoraToken,
      uid,
      appId: process.env.AGORA_APP_ID,
      user: call.user,
      isFreeCall,
      freeSeconds: FREE_CALL_SECONDS,
      planSecondsLeft: totalPlanSeconds,
      walletBalance: null,
      ratePerSecond: null,
    });
  } catch (err) {
    console.error("Mobile Accept Call Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
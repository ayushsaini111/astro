import { after } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { sendEvent } from "@/lib/sse";
import { messaging } from "@/lib/firebaseAdmin";
import { FREE_CALL_SECONDS } from "@/lib/freeCall";
import { startCallRecording } from "@/lib/agoraRecording";

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let payload;
    try {
      payload = jwt.verify(auth.replace("Bearer ", ""), process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { callId } = await req.json();
    if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });

    const [pandit, call] = await Promise.all([
      prisma.pandit.findUnique({
        where: { id: payload.id },
        select: { id: true, name: true, speciality: true, profilePic: true },
      }),
      prisma.call.findUnique({
        where: { id: callId },
        include: { user: { select: { name: true, dob: true, fcmToken: true } } },
      }),
    ]);
    if (!pandit) return NextResponse.json({ error: "Pandit not found" }, { status: 404 });
    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    if (["ONGOING", "COMPLETED", "FAILED"].includes(call.status)) {
      return NextResponse.json({ error: "Call already accepted or ended" }, { status: 400 });
    }

    const uid = Math.floor(Math.random() * 100000) + 1;
    let userUid = Math.floor(Math.random() * 100000) + 1;
    while (userUid === uid) userUid = Math.floor(Math.random() * 100000) + 1;
    const agoraToken = generateAgoraToken(call.channelName, uid);
    const userAgoraToken = generateAgoraToken(call.channelName, userUid);
    const now = new Date();

    const sseSent = sendEvent(`user-${call.userId}`, "call-ringing", {
      callId: call.id,
      channelName: call.channelName,
      token: userAgoraToken,
      uid: userUid,
      appId: process.env.AGORA_APP_ID,
      pandit: { name: pandit.name, speciality: pandit.speciality, profilePic: pandit.profilePic },
    });

    let pushOk = false;
    const pushP = call.user?.fcmToken
      ? messaging
          .send({
            token: call.user.fcmToken,
            data: {
              type: "call_connected",
              callId: String(call.id),
              channelName: call.channelName,
              token: userAgoraToken,
              appId: String(process.env.AGORA_APP_ID),
              uid: String(userUid),
              callerName: pandit.name || "Expert",
              panditName: pandit.name || "Expert",
            },
            android: { priority: "high", ttl: 30000 },
            apns: { payload: { aps: { contentAvailable: true } }, headers: { "apns-priority": "10" } },
          })
          .then(() => { pushOk = true; })
          .catch((e) => console.error("FCM to user failed:", e.code, e.message))
      : Promise.resolve();

    const [, userPlans, freeUsage] = await Promise.all([
      prisma.call.update({
        where: { id: call.id },
        data: { status: "RINGING", agoraToken, startTime: now },
      }),
      prisma.userPlan.findMany({
        where: { userId: call.userId, isActive: true, remainingSeconds: { gt: 0 }, endDate: { gte: now } },
        select: { remainingSeconds: true },
      }),
      prisma.freeCallUsage.findUnique({ where: { userId: call.userId } }),
      // Only block the response on the push if SSE did not reach the user.
      sseSent ? null : pushP,
    ]);

    if (sseSent) after(() => pushP);

    after(() =>
      startCallRecording({
        callId: call.id,
        channelName: call.channelName,
        panditId: pandit.id,
        panditName: pandit.name,
      }).catch((e) => console.error("startCallRecording failed:", e.message))
    );

    return NextResponse.json({
      success: true,
      callId: call.id,
      channelName: call.channelName,
      token: agoraToken,
      uid,
      appId: process.env.AGORA_APP_ID,
      user: { name: call.user?.name, dob: call.user?.dob },
      isFreeCall: !freeUsage && !!call.isFreeCall && userPlans.length === 0,
      freeSeconds: FREE_CALL_SECONDS,
      planSecondsLeft: userPlans.reduce((s, p) => s + p.remainingSeconds, 0),
      walletBalance: null,
      ratePerSecond: null,
      userReachable: sseSent || pushOk,
    });
  } catch (err) {
    console.error("Mobile Accept Call Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
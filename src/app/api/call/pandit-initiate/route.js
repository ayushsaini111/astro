import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendEvent } from "@/lib/sse";
import { messaging } from "@/lib/firebaseAdmin"; // ✅ ADD THIS

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pandit = await prisma.pandit.findUnique({ where: { id: session.user.id } });
  if (!pandit) return NextResponse.json({ error: "Not a pandit" }, { status: 403 });

  const { callId } = await req.json();
  if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });

  const call = await prisma.call.findUnique({
    where: { id: callId },
    // ✅ ADD fcmToken to user select
    include: { user: { select: { username: true, dob: true, fcmToken: true } } },
  });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const uid = Math.floor(Math.random() * 100000);
  const token = generateAgoraToken(call.channelName, uid);
  const now = new Date();

  await prisma.call.update({
    where: { id: callId },
    data: { status: "RINGING", agoraToken: token, startTime: now },
  });

  const userPayload = {
    callId: call.id,
    channelName: call.channelName,
    token,
    uid,
    appId: process.env.AGORA_APP_ID,
    pandit: { name: pandit.name, speciality: pandit.speciality, profilePic: pandit.profilePic },
  };

  // ✅ Push to user via SSE — works when app is open
  sendEvent(`user-${call.userId}`, "call-ringing", userPayload);

  // ✅ FCM — works in BOTH foreground and background/killed states
  if (call.user?.fcmToken) {
    try {
      await messaging.send({
        token: call.user.fcmToken,
        data: {
          type:        'incoming_call',
          callId:      call.id,
          channelName: call.channelName,
          token:       token,
          appId:       process.env.AGORA_APP_ID,
          uid:         String(uid),
          callerName:  pandit.name || 'Expert',
          panditName:  pandit.name || 'Expert',
        },
        notification: {
          title: '📞 Incoming Call',
          body:  `${pandit.name || 'Expert'} is calling you now`,
        },
        android: {
          priority: 'high',
          ttl: 30000,
          notification: {
            channelId: 'default',
            sound:     'default',
            priority:  'max',
          },
        },
        apns: {
          payload: { aps: { contentAvailable: true, sound: 'default' } },
          headers: { 'apns-priority': '10' },
        },
      });
      console.log('✅ FCM sent to user:', call.user.username);
    } catch (err) {
      console.error('❌ FCM to user failed:', err.message);
    }
  } else {
    console.log('❌ No FCM token for user on pandit-initiate');
  }

  return NextResponse.json({
    callId: call.id,
    channelName: call.channelName,
    token,
    uid,
    appId: process.env.AGORA_APP_ID,
    user: call.user,
  });
}
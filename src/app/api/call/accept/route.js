// backend/src/app/api/call/accept/route.js

import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { sendEvent } from "@/lib/sse";

export async function POST(req) {
  try {
    // ─── Auth ────────────────────────────────────────────────────────────────
    let userId = req.headers.get("x-user-id");

    if (!userId) {
      const cookieStore = await cookies();
      userId = cookieStore.get("userId")?.value;
    }

    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId } = await req.json();
    if (!callId) {
      return Response.json({ error: "Missing callId" }, { status: 400 });
    }

    console.log("🎯 Accept request:", { callId, acceptedBy: userId });

    // ─── Fetch call ──────────────────────────────────────────────────────────
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        pandit: { select: { id: true, name: true, speciality: true, profilePic: true } },
        user: { select: { id: true, name: true, profilePic: true } },
      },
    });

    if (!call) {
      console.error("❌ Call not found:", callId);
      return Response.json({ error: "Call not found" }, { status: 404 });
    }

    console.log("📞 Call found:", {
      callId: call.id,
      userId: call.userId,
      panditId: call.panditId,
      status: call.status,
    });

    if (call.status === "COMPLETED" || call.status === "FAILED") {
      return Response.json({ error: "Call no longer active" }, { status: 400 });
    }

    // ✅ FIX: Define `now` variable
    const now = new Date();

    // ─── Determine who is accepting ──────────────────────────────────────────
    const isPandit = userId === call.panditId;
    const isUser = userId === call.userId;

    if (!isPandit && !isUser) {
      return Response.json({ error: "Unauthorized for this call" }, { status: 403 });
    }

    // ─── Balance info (for user) ─────────────────────────────────────────────
    let balanceInfo = {};

    if (call.userId) {
      const [freeUsage, activePlans] = await Promise.all([
        prisma.freeCallUsage.findUnique({ where: { userId: call.userId } }),
        prisma.userPlan.findMany({
          where: {
            userId: call.userId,
            isActive: true,
            endDate: { gte: now },
            remainingSeconds: { gt: 0 },
          },
        }),
      ]);

      const totalSeconds = activePlans.reduce((sum, p) => sum + p.remainingSeconds, 0);
      balanceInfo = {
        isFreeCall: !freeUsage && activePlans.length === 0,
        planSecondsLeft: totalSeconds,
      };
    }

    // ─── Generate token for the accepting party ──────────────────────────────
    const uid = Math.floor(Math.random() * 100000);
    const token = generateAgoraToken(call.channelName, uid);

    // ─── Update call status ──────────────────────────────────────────────────
    // If user accepts → set to ONGOING
    // If pandit accepts → set to RINGING (waiting for user)
    const newStatus = isUser ? "ONGOING" : "RINGING";
    const updateData = {
      status: newStatus,
    };

    // Start timer only when ONGOING
    if (newStatus === "ONGOING") {
      updateData.startTime = now;
    }

    await prisma.call.update({
      where: { id: callId },
      data: updateData,
    });

    // ─── Build response payload ──────────────────────────────────────────────
    const responsePayload = {
      callId: call.id,
      channelName: call.channelName,
      token,
      uid,
      appId: process.env.AGORA_APP_ID,
      ...balanceInfo,
    };

    // ✅ Add caller info based on who is accepting
    if (isPandit) {
      responsePayload.pandit = call.user; // Pandit sees user info
    } else {
      responsePayload.pandit = call.pandit; // User sees pandit info
    }

    console.log("✅ Accept successful:", {
      acceptedBy: isPandit ? "pandit" : "user",
      newStatus,
    });

    // ─── Send SSE to the other party ─────────────────────────────────────────
    if (isPandit) {
      // ✅ Pandit accepted → notify user with "call-ringing"
      console.log("📣 Sending call-ringing to user:", `user-${call.userId}`);
      
      const userPayload = {
        callId: call.id,
        channelName: call.channelName,
        token: generateAgoraToken(call.channelName, Math.floor(Math.random() * 100000)),
        uid: Math.floor(Math.random() * 100000),
        appId: process.env.AGORA_APP_ID,
        pandit: call.pandit,
        ...balanceInfo,
      };
      
      sendEvent(`user-${call.userId}`, "call-ringing", userPayload);
    } else {
      // ✅ User accepted → notify pandit with "call-accepted"
      console.log("📣 Sending call-accepted to pandit:", `pandit-${call.panditId}`);
      
      const panditPayload = {
        callId: call.id,
        channelName: call.channelName,
        token: generateAgoraToken(call.channelName, Math.floor(Math.random() * 100000)),
        uid: Math.floor(Math.random() * 100000),
        appId: process.env.AGORA_APP_ID,
        pandit: call.user,
      };
      
      sendEvent(`pandit-${call.panditId}`, "call-accepted", panditPayload);
    }

    return Response.json(responsePayload);

  } catch (err) {
    console.error("❌ Accept error:", err.message, err.stack);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
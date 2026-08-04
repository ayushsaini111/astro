// backend/src/app/api/call/status/route.js

import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");

    if (!callId) {
      return Response.json({ error: "Missing callId" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        pandit: {
          select: { name: true, speciality: true, profilePic: true },
        },
      },
    });

    if (!call) {
      return Response.json({ error: "Call not found" }, { status: 404 });
    }

    const response = {
      callId: call.id,
      status: call.status,
      channelName: call.channelName,
      pandit: call.pandit,
      startTime: call.startTime,
      endTime: call.endTime,
      duration: call.duration,
    };

    // ✅ If RINGING, include user credentials for joining
    if (call.status === "RINGING") {
      const userUid = Math.floor(Math.random() * 100000);
      const userToken = generateAgoraToken(call.channelName, userUid);

      // Get balance info
      const now = new Date();
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

      response.userToken = userToken;
      response.userUid = userUid;
      response.appId = process.env.AGORA_APP_ID;
      response.isFreeCall = !freeUsage && activePlans.length === 0;
      response.planSecondsLeft = totalSeconds;

      console.log("✅ Status API returning user credentials:", {
        callId,
        userUid,
        isFreeCall: response.isFreeCall,
      });
    }

    return Response.json(response);
  } catch (err) {
    console.error("❌ Status API error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
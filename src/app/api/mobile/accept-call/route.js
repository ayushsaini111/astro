// app/api/mobile/accept-call/route.js

import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEvent } from "@/lib/sse";

const FREE_CALL_SECONDS = 5;

export async function POST(req) {
  try {
    // ------------------------------------
    // Verify JWT
    // ------------------------------------
    const auth = req.headers.get("authorization");

    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    let payload;

    try {
      payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // ------------------------------------
    // Find Pandit
    // ------------------------------------
    const pandit = await prisma.pandit.findUnique({
      where: { id: payload.id },
    });

    if (!pandit) {
      return NextResponse.json(
        { error: "Pandit not found" },
        { status: 404 }
      );
    }

    // ------------------------------------
    // Get callId from body
    // ------------------------------------
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json(
        { error: "Missing callId" },
        { status: 400 }
      );
    }

    // ------------------------------------
    // Find Call
    // ------------------------------------
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        user: {
          select: {
            username: true,
            dob: true,
          },
        },
      },
    });

    if (!call) {
      return NextResponse.json(
        { error: "Call not found" },
        { status: 404 }
      );
    }

    // ------------------------------------
    // Already accepted?
    // ------------------------------------
    if (
      call.status === "ONGOING" ||
      call.status === "COMPLETED"
    ) {
      return NextResponse.json(
        { error: "Call already accepted" },
        { status: 400 }
      );
    }

    // ------------------------------------
    // Generate Agora Token
    // ------------------------------------
    const uid = Math.floor(Math.random() * 100000);
    const agoraToken = generateAgoraToken(call.channelName, uid);
    const now = new Date();

    // ------------------------------------
    // Update Call status
    // ------------------------------------
    await prisma.call.update({
      where: { id: call.id },
      data: {
        status: "RINGING",
        agoraToken,
        startTime: now,
      },
    });

    // ------------------------------------
    // Fetch user's active plans
    // ------------------------------------
    const userPlans = await prisma.userPlan.findMany({
      where: {
        userId: call.userId,
        isActive: true,
        remainingSeconds: { gt: 0 },
        endDate: { gte: now },
      },
      orderBy: { endDate: "asc" },
    });

    const totalPlanSeconds = userPlans.reduce(
      (sum, p) => sum + p.remainingSeconds,
      0
    );

    // ------------------------------------
    // Check free call eligibility
    // ------------------------------------
    const freeCallUsage = await prisma.freeCallUsage.findUnique({
      where: { userId: call.userId },
    });

    const isFreeCall =
      !freeCallUsage &&
      !!call.isFreeCall &&
      userPlans.length === 0;

    // ------------------------------------
    // Notify User via SSE
    // ------------------------------------
    sendEvent(`user-${call.userId}`, "call-ringing", {
      callId: call.id,
      channelName: call.channelName,
      token: agoraToken,
      uid,
      appId: process.env.AGORA_APP_ID,
      pandit: {
        name: pandit.name,
        speciality: pandit.speciality,
        profilePic: pandit.profilePic,
      },
    });

    // ------------------------------------
    // Log for debugging
    // ------------------------------------
    console.log("================================");
    console.log("MOBILE CALL ACCEPTED");
    console.log("Pandit:", pandit.id);
    console.log("Call:", callId);
    console.log("Total Plan Seconds:", totalPlanSeconds);
    console.log("Is Free Call:", isFreeCall);
    console.log("================================");

    // ------------------------------------
    // Response to Mobile App
    // ------------------------------------
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

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
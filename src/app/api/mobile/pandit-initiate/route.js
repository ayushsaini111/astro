import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEvent } from "@/lib/sse";

export async function POST(req) {
  try {
    // ------------------------------------
    // Verify JWT from React Native app
    // ------------------------------------
    const auth = req.headers.get("authorization");

    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    let payload;

    try {
      payload = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // ------------------------------------
    // Find pandit
    // ------------------------------------
    const pandit = await prisma.pandit.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!pandit) {
      return NextResponse.json(
        { error: "Pandit not found" },
        { status: 404 }
      );
    }

    // ------------------------------------
    // Get call id
    // ------------------------------------
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json(
        { error: "Missing callId" },
        { status: 400 }
      );
    }

    // ------------------------------------
    // Find call
    // ------------------------------------
    const call = await prisma.call.findUnique({
      where: {
        id: callId,
      },
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
        {
          error: "Call already accepted",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------
    // Generate Agora Token
    // ------------------------------------
    const uid = Math.floor(Math.random() * 100000);

    const agoraToken = generateAgoraToken(
      call.channelName,
      uid
    );

    const now = new Date();

    // ------------------------------------
    // Update Call
    // ------------------------------------
    await prisma.call.update({
      where: {
        id: call.id,
      },
      data: {
        status: "RINGING",
        agoraToken,
        startTime: now,
      },
    });

    // ------------------------------------
    // Notify User (SSE)
    // ------------------------------------
    sendEvent(
      `user-${call.userId}`,
      "call-ringing",
      {
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
      }
    );

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
    });
  } catch (err) {
    console.error(
      "Mobile pandit initiate error:",
      err
    );

    return NextResponse.json(
      {
        error: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}
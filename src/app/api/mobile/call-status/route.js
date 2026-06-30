import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
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
    // Get callId
    // ------------------------------------
    const { searchParams } = new URL(req.url);

    const callId = searchParams.get("callId");

    if (!callId) {
      return NextResponse.json(
        {
          error: "Missing callId",
        },
        {
          status: 400,
        }
      );
    }

    // ------------------------------------
    // Find Call
    // ------------------------------------
    const call = await prisma.call.findUnique({
      where: {
        id: callId,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        pandit: {
          select: {
            name: true,
            speciality: true,
            profilePic: true,
          },
        },
      },
    });

    if (!call) {
      return NextResponse.json(
        {
          error: "Call not found",
        },
        {
          status: 404,
        }
      );
    }

    // ------------------------------------
    // Verify Access
    // ------------------------------------
    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
      },
    });

    const pandit = await prisma.pandit.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
      },
    });

    const allowed =
      (user && call.userId === user.id) ||
      (pandit && call.panditId === pandit.id);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    // ------------------------------------
    // Response
    // ------------------------------------
    return NextResponse.json({
      success: true,
      call: {
        id: call.id,
        status: call.status,
        channelName: call.channelName,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        isFreeCall: call.isFreeCall,
        billingType: call.billingType,
        user: call.user,
        pandit: call.pandit,
      },
    });
  } catch (err) {
    console.error("Call Status Error:", err);

    return NextResponse.json(
      {
        error: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
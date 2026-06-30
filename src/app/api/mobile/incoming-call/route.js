import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // -----------------------------
    // Verify JWT
    // -----------------------------
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

    // ----------------------------------
    // Find User
    // ----------------------------------

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // ----------------------------------
    // Find active ringing call
    // ----------------------------------

    const call = await prisma.call.findFirst({
      where: {
        userId: user.id,
        status: "RINGING",
      },
      include: {
        pandit: {
          select: {
            name: true,
            speciality: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!call) {
      return NextResponse.json({
        call: null,
      });
    }

    return NextResponse.json({
      call: {
        id: call.id,
        channelName: call.channelName,
        agoraToken: call.agoraToken,
        appId: process.env.AGORA_APP_ID,
        pandit: call.pandit,
        startTime: call.startTime,
      },
    });
  } catch (err) {
    console.error(
      "Incoming Call Error:",
      err
    );

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
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // -------------------------------
    // Verify JWT
    // -------------------------------
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

    // -------------------------------
    // Find pandit
    // -------------------------------
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

    // -------------------------------
    // Auto complete stuck calls
    // -------------------------------
    await prisma.call.updateMany({
      where: {
        panditId: pandit.id,
        status: "ONGOING",
        OR: [
          {
            endTime: {
              not: null,
            },
          },
          {
            startTime: {
              lt: new Date(Date.now() - 60 * 60 * 1000),
            },
          },
        ],
      },
      data: {
        status: "COMPLETED",
        autoEnded: true,
      },
    });

    // -------------------------------
    // Get Calls
    // -------------------------------
    const calls = await prisma.call.findMany({
      where: {
        panditId: pandit.id,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // -------------------------------
    // Today's COMPLETED calls only
    // -------------------------------
    const todayCompletedCalls = calls.filter(call => {
      if (call.status !== "COMPLETED") return false;

      const completedAt = call.endTime
        ? new Date(call.endTime)
        : new Date(call.createdAt);

      return completedAt >= today;
    });

    const todayCalls = todayCompletedCalls.length;

    const todayEarnings = todayCompletedCalls.reduce(
      (sum, call) => sum + (call.totalCost || 0),
      0
    );

    const totalSeconds = todayCompletedCalls.reduce(
      (sum, call) => sum + (call.duration || 0),
      0
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const talkTime = `${hours}h ${minutes}m`;

    const resolveUsername = call =>
      call.user?.username ||
      call.deletedUsername ||
      "Deleted User";

    // -------------------------------
    // Recent Requests (Dashboard)
    // -------------------------------
    const recentCalls = calls
      .filter(
        call =>
          call.status === "INITIATED" ||
          call.status === "RINGING"
      )
      .slice(0, 3)
      .map(call => ({
        ...call,
        displayUsername: resolveUsername(call),
      }));

    // -------------------------------
    // Full History
    // -------------------------------
    const allCalls = calls.map(call => ({
      ...call,
      displayUsername: resolveUsername(call),
    }));

    return NextResponse.json({
      pendingRequests: calls.filter(
        call =>
          call.status === "INITIATED" ||
          call.status === "RINGING"
      ).length,

      ongoingCalls: calls.filter(
        call => call.status === "ONGOING"
      ).length,
 isAvailable: pandit.isAvailable,
      todayCalls,

      todayEarnings,

      talkTime,

      recentCalls,

      calls: allCalls,
    });
  } catch (err) {
    console.error("Mobile dashboard error:", err);

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
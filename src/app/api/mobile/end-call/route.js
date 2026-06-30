import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEvent } from "@/lib/sse";

const FREE_CALL_SECONDS = 5;

export async function POST(req) {
  try {
    // ----------------------------------
    // Verify JWT
    // ----------------------------------
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
    // Find Pandit
    // ----------------------------------

    const pandit = await prisma.pandit.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!pandit) {
      return NextResponse.json(
        {
          error: "Pandit not found",
        },
        {
          status: 404,
        }
      );
    }

    // ----------------------------------
    // Body
    // ----------------------------------

    const {
      callId,
      clientDuration,
    } = await req.json();

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

    // ----------------------------------
    // Find Call
    // ----------------------------------

    const call = await prisma.call.findUnique({
      where: {
        id: callId,
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

    // Security
    if (call.panditId !== pandit.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    // Already ended
    if (call.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
      });
    }

    const now = new Date();

    const durationSeconds =
      typeof clientDuration === "number"
        ? clientDuration
        : Math.floor(
            (now -
              (call.startTime ??
                call.createdAt)) / 1000
          );

    // ----------------------------------
    // Free Call
    // ----------------------------------

    let billableSeconds = durationSeconds;

    if (call.isFreeCall) {
      billableSeconds = Math.min(
        durationSeconds,
        FREE_CALL_SECONDS
      );

      await prisma.freeCallUsage.upsert({
        where: {
          userId: call.userId,
        },
        update: {},
        create: {
          userId: call.userId,
          callId,
          usedAt: now,
        },
      });
    }

    // ----------------------------------
    // Deduct Plan Seconds
    // ----------------------------------

    if (!call.isFreeCall) {
      let remaining = durationSeconds;

      const plans =
        await prisma.userPlan.findMany({
          where: {
            userId: call.userId,
            isActive: true,
            remainingSeconds: {
              gt: 0,
            },
            endDate: {
              gte: now,
            },
          },
          orderBy: {
            endDate: "asc",
          },
        });

      for (const plan of plans) {
        if (remaining <= 0) break;

        const deduct = Math.min(
          remaining,
          plan.remainingSeconds
        );

        await prisma.userPlan.update({
          where: {
            id: plan.id,
          },
          data: {
            remainingSeconds: {
              decrement: deduct,
            },
            perDayUsedSeconds: {
              increment: deduct,
            },
            lastUsedDate: now,
          },
        });

        remaining -= deduct;
      }
    }

    // ----------------------------------
    // Complete Call
    // ----------------------------------

    await prisma.call.update({
      where: {
        id: callId,
      },
      data: {
        status: "COMPLETED",
        endTime: now,
        duration: durationSeconds,
        billableSeconds,
        totalCost: 0,
        endedBy: pandit.id,
      },
    });

    // ----------------------------------
    // Notify User
    // ----------------------------------

    sendEvent(
      `user-${call.userId}`,
      "call-ended",
      {
        callId,
        status: "COMPLETED",
      }
    );

    // ----------------------------------
    // Notify Pandit
    // ----------------------------------

    sendEvent(
      `pandit-${call.panditId}`,
      "call-ended",
      {
        callId,
        status: "COMPLETED",
      }
    );

    return NextResponse.json({
      success: true,
      duration: durationSeconds,
    });

  } catch (err) {
    console.error(
      "Mobile End Call Error",
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
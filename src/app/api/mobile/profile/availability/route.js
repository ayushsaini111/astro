import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function PATCH(req) {
  try {
    // ---------------------------
    // Verify JWT
    // ---------------------------
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

    // ---------------------------
    // Body
    // ---------------------------
    const body = await req.json();

    const {
      isAvailable,
      startTime,
      endTime,
      breakTime,
      workingDays,
    } = body;

    const data = {};

    if (typeof isAvailable === "boolean") {
      data.isAvailable = isAvailable;
    }

    if (startTime) {
      data.startTime = startTime;
    }

    if (endTime) {
      data.endTime = endTime;
    }

    if (breakTime) {
      data.breakTime = breakTime;
    }

    if (workingDays) {
      if (!Array.isArray(workingDays)) {
        return NextResponse.json(
          {
            error: "workingDays must be an array",
          },
          {
            status: 400,
          }
        );
      }

      if (workingDays.length === 0) {
        return NextResponse.json(
          {
            error:
              "Select at least one working day",
          },
          {
            status: 400,
          }
        );
      }

      data.workingDays = workingDays;
    }

    // ---------------------------
    // Validate Time
    // ---------------------------

    if (startTime && endTime) {
      const [sh, sm] = startTime
        .split(":")
        .map(Number);

      const [eh, em] = endTime
        .split(":")
        .map(Number);

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      if (endMinutes <= startMinutes) {
        return NextResponse.json(
          {
            error:
              "End time must be after Start time",
          },
          {
            status: 400,
          }
        );
      }
    }

    const updated =
      await prisma.pandit.update({
        where: {
          id: payload.id,
        },
        data,
        select: {
          isAvailable: true,
          startTime: true,
          endTime: true,
          breakTime: true,
          workingDays: true,
        },
      });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error(err);

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
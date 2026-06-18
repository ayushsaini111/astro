// app/api/pandit/profile/availability/route.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    isAvailable,
    startTime,
    endTime,
    breakTime,
    workingDays,
  } = body;

  try {
    // Validation
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      const startTotalMin = startHour * 60 + startMin;
      const endTotalMin = endHour * 60 + endMin;

      if (endTotalMin <= startTotalMin) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    if (workingDays && workingDays.length === 0) {
      return NextResponse.json(
        { error: "At least one working day required" },
        { status: 400 }
      );
    }

    // Update
    const data = {};
    if (isAvailable !== undefined) data.isAvailable = isAvailable;
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;
    if (breakTime) data.breakTime = breakTime;
    if (workingDays) data.workingDays = workingDays;

    const updated = await prisma.pandit.update({
      where: { id: session.user.id },
      data,
      select: {
        isAvailable: true,
        startTime: true,
        endTime: true,
        breakTime: true,
        workingDays: true,
      },
    });

    console.log("✅ Availability updated for:", session.user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("❌ Availability update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
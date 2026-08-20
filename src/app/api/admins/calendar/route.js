// src/app/backend/admins/calendar/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear());
    const month = searchParams.get("month");

    const startDate = new Date(year, month ? parseInt(month) : 0, 1);
    const endDate = new Date(year, month ? parseInt(month) + 1 : 12, 0);

    if (!prisma.calendarAvailability) {
      console.warn("⚠️ CalendarAvailability model not found");
      return NextResponse.json({ 
        success: true, 
        availability: [],
      });
    }

    const availability = await prisma.calendarAvailability.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        date: true,
        isAvailable: true,
        timeSlots: true,
        reason: true,
      },
      orderBy: { date: "asc" },
    });

    // ✅ Parse JSON timeSlots
    const parsedAvailability = availability.map(item => ({
      ...item,
      timeSlots: typeof item.timeSlots === 'string' 
        ? JSON.parse(item.timeSlots) 
        : item.timeSlots
    }));

    return NextResponse.json({ 
      success: true, 
      availability: parsedAvailability 
    });
  } catch (error) {
    console.error("❌ Get calendar error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { date, isAvailable, timeSlots, reason } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    if (!prisma.calendarAvailability) {
      return NextResponse.json(
        { 
          success: false, 
          error: "CalendarAvailability model not configured. Please run: npx prisma db push" 
        },
        { status: 500 }
      );
    }

    // ✅ Ensure proper date handling
    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const defaultTimeSlots = {
      "8-12": true,
      "12-15": true,
      "15-19": true,
      "19-22": true,
    };

    // ✅ Ensure timeSlots is an object
    const timeSlotsToSave = timeSlots || defaultTimeSlots;

    const availability = await prisma.calendarAvailability.upsert({
      where: { date: dateObj },
      update: {
        isAvailable: isAvailable ?? true,
        timeSlots: timeSlotsToSave,
        reason: reason || null,
      },
      create: {
        date: dateObj,
        isAvailable: isAvailable ?? true,
        timeSlots: timeSlotsToSave,
        reason: reason || null,
      },
    });

    // ✅ Parse timeSlots for response
    const parsedAvailability = {
      ...availability,
      timeSlots: typeof availability.timeSlots === 'string'
        ? JSON.parse(availability.timeSlots)
        : availability.timeSlots
    };

    return NextResponse.json({
      success: true,
      availability: parsedAvailability,
      message: "Calendar updated successfully",
    });
  } catch (error) {
    console.error("❌ Update calendar error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    if (!prisma.calendarAvailability) {
      return NextResponse.json(
        { success: false, error: "CalendarAvailability model not configured" },
        { status: 500 }
      );
    }

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    await prisma.calendarAvailability.delete({
      where: { date: dateObj },
    });

    return NextResponse.json({
      success: true,
      message: "Availability deleted",
    });
  } catch (error) {
    console.error("❌ Delete calendar error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
// src/app/backend/admins/calendar/availability/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const date = searchParams.get("date");

    let where = {};

    if (date) {
      const dateObj = new Date(date);
      dateObj.setUTCHours(0, 0, 0, 0);
      where.date = dateObj;
    } else {
      const start = startDate ? new Date(startDate) : new Date();
      start.setUTCHours(0, 0, 0, 0);
      
      const end = endDate 
        ? new Date(endDate) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      end.setUTCHours(23, 59, 59, 999);

      where.date = {
        gte: start,
        lte: end,
      };
    }

    if (!prisma.calendarAvailability) {
      return NextResponse.json({ 
        success: true, 
        availability: [] 
      });
    }

    const availability = await prisma.calendarAvailability.findMany({
      where,
      select: {
        date: true,
        isAvailable: true,
        timeSlots: true,
      },
      orderBy: { date: "asc" },
    });

    // ✅ Parse JSON timeSlots
    const parsedAvailability = availability.map(item => ({
      ...item,
      date: item.date.toISOString(),
      timeSlots: typeof item.timeSlots === 'string' 
        ? JSON.parse(item.timeSlots) 
        : item.timeSlots
    }));

    return NextResponse.json({ 
      success: true, 
      availability: parsedAvailability 
    });
  } catch (error) {
    console.error("❌ Get availability error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
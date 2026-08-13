// app/api/festivals/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  try {
    const festivals = await prisma.panchangFestival.findMany({
      where: month ? { month } : undefined,
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(festivals);
  } catch (error) {
    console.error("Error fetching festivals:", error);
    return NextResponse.json({ error: "Failed to fetch festivals" }, { status: 500 });
  }
}
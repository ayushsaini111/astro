import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function formatTalkTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ✅ Get current date/time info in IST, reliably
function getISTDateParts() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
}

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = auth.replace("Bearer ", "");
    let payload;
    try {
      payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const pandit = await prisma.pandit.findUnique({ where: { id: payload.id } });
    if (!pandit) return NextResponse.json({ error: "Pandit not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "today"; // today | week | month
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 10;

    // ✅ IST-safe "now"
    const istNow = getISTDateParts();

    let startDate;

    if (category === "today") {
      startDate = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 0, 0, 0);
    } else if (category === "week") {
      // ✅ rolling last 7 days INCLUDING today
      startDate = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate() - 6, 0, 0, 0);
    } else {
      // ✅ month — from 1st of current month to now
      startDate = new Date(istNow.getFullYear(), istNow.getMonth(), 1, 0, 0, 0);
    }

    // ✅ Convert local IST wall-clock time back to actual UTC instant for DB comparison
    const startDateUTC = new Date(startDate.toLocaleString("en-US", { timeZone: "UTC" }));
    // Simpler & more reliable: just offset manually
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const startDateForQuery = new Date(startDate.getTime() - IST_OFFSET_MS);

    const whereClause = {
      panditId: pandit.id,
      status: { in: ["COMPLETED", "FAILED"] },
      createdAt: { gte: startDateForQuery },
    };

    // ✅ Stats computed across FULL range (not just current page)
    const statsRows = await prisma.call.findMany({
      where: whereClause,
      select: { status: true, duration: true },
    });

    const completedCalls = statsRows.filter((c) => c.status === "COMPLETED").length;
    const totalCalls = statsRows.length;
    const totalSeconds = statsRows.reduce((sum, c) => {
      if (c.status !== "COMPLETED") return sum;
      return sum + (c.duration || 0);
    }, 0);
    const talkTime = formatTalkTime(totalSeconds);

    const totalPages = Math.max(1, Math.ceil(totalCalls / pageSize));

    // ✅ Paginated list
    const calls = await prisma.call.findMany({
      where: whereClause,
      include: { user: { select: { name: true } } }, // ✅ FIXED — was username
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const formattedCalls = calls.map((call) => ({
      ...call,
      displayUsername: call.user?.name || call.deletedUsername || "Deleted User", // ✅ FIXED
    }));

    return NextResponse.json({
      calls: formattedCalls,
      isAvailable: pandit.isAvailable,
      category,
      page,
      totalPages,
      hasMore: page < totalPages,
      completedCalls,
      totalCalls,
      talkTime,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function formatTalkTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
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

    const calls = await prisma.call.findMany({
      where: { panditId: pandit.id, status: "COMPLETED" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const getCallDate = (call) => new Date(call.endTime || call.createdAt);

    const todayCallsArr = calls.filter((c) => getCallDate(c) >= startOfToday);
    const weekCallsArr = calls.filter((c) => getCallDate(c) >= startOfWeek);
    const monthCallsArr = calls.filter((c) => getCallDate(c) >= startOfMonth);

    const sumEarnings = (arr) => arr.reduce((sum, c) => sum + (c.totalCost || 0), 0);
    const sumSeconds = (arr) => arr.reduce((sum, c) => sum + (c.duration || 0), 0);

    const todayEarnings = sumEarnings(todayCallsArr);
    const weekEarnings = sumEarnings(weekCallsArr);
    const monthEarnings = sumEarnings(monthCallsArr);

    const todayCalls = todayCallsArr.length;
    const weekCalls = weekCallsArr.length;
    const monthCalls = monthCallsArr.length;

    const todayTalkTime = formatTalkTime(sumSeconds(todayCallsArr));
    const weekTalkTime = formatTalkTime(sumSeconds(weekCallsArr));
    const monthTalkTime = formatTalkTime(sumSeconds(monthCallsArr));

    const groupByDay = (arr) => {
      const map = {};
      arr.forEach((call) => {
        const dateKey = getCallDate(call).toISOString().split("T")[0];
        if (!map[dateKey]) map[dateKey] = { date: dateKey, earnings: 0, calls: 0, seconds: 0 };
        map[dateKey].earnings += call.totalCost || 0;
        map[dateKey].calls += 1;
        map[dateKey].seconds += call.duration || 0;
      });
      return Object.values(map).sort((a, b) => (a.date < b.date ? 1 : -1));
    };

    const responseData = {
      todayEarnings, weekEarnings, monthEarnings,
      todayCalls, weekCalls, monthCalls,
      todayTalkTime, weekTalkTime, monthTalkTime,
      category, page,
    };

    if (category === "today") {
      const transactions = todayCallsArr.map((call) => ({
        id: call.id,
        date: getCallDate(call).toISOString().split("T")[0],
        amount: call.totalCost || 0,
        userName: call.user?.name || "Deleted User",
        duration: call.duration || 0,
      }));
      const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
      responseData.transactions = transactions.slice((page - 1) * pageSize, page * pageSize);
      responseData.totalPages = totalPages;
      responseData.hasMore = page < totalPages;
    } else if (category === "week") {
      responseData.breakdown = groupByDay(weekCallsArr); // max 7 days, no pagination
      responseData.totalPages = 1;
      responseData.hasMore = false;
    } else if (category === "month") {
      const fullBreakdown = groupByDay(monthCallsArr);
      const totalPages = Math.max(1, Math.ceil(fullBreakdown.length / pageSize));
      responseData.breakdown = fullBreakdown.slice((page - 1) * pageSize, page * pageSize);
      responseData.totalPages = totalPages;
      responseData.hasMore = page < totalPages;
    }

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Mobile earnings error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
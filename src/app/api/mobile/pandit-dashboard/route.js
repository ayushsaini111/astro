import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const IST_MS = 5.5 * 60 * 60 * 1000;
const PENDING = ["INITIATED", "RINGING"];

function startOfTodayIST() {
  const ist = new Date(Date.now() + IST_MS);
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_MS
  );
}

const resolveUsername = (call) => {
  if (call.user?.name) return call.user.name;
  if (call.deletedUsername) return call.deletedUsername;
  if (call.user === null) return "Deleted User";
  return "User";
};

const callSelect = {
  id: true,
  status: true,
  createdAt: true,
  duration: true,
  deletedUsername: true,
  user: { select: { name: true } },
};

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(auth.replace("Bearer ", ""), process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const pandit = await prisma.pandit.findUnique({
      where: { id: payload.id },
      select: { id: true, isAvailable: true },
    });
    if (!pandit) {
      return NextResponse.json({ error: "Pandit not found" }, { status: 404 });
    }

    await prisma.call.updateMany({
      where: {
        panditId: pandit.id,
        status: "ONGOING",
        OR: [
          { endTime: { not: null } },
          { startTime: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
        ],
      },
      data: { status: "COMPLETED", autoEnded: true },
    });

    const start = startOfTodayIST();

    const [recent, todayList, completedToday, pendingCount, ongoingCount] =
      await Promise.all([
        prisma.call.findMany({
          where: { panditId: pandit.id, status: { in: PENDING } },
          select: callSelect,
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.call.findMany({
          where: { panditId: pandit.id, createdAt: { gte: start } },
          select: callSelect,
          orderBy: { createdAt: "desc" },
        }),
        prisma.call.findMany({
          where: {
            panditId: pandit.id,
            status: "COMPLETED",
            OR: [
              { endTime: { gte: start } },
              { endTime: null, createdAt: { gte: start } },
            ],
          },
          select: { totalCost: true, duration: true },
        }),
        prisma.call.count({ where: { panditId: pandit.id, status: { in: PENDING } } }),
        prisma.call.count({ where: { panditId: pandit.id, status: "ONGOING" } }),
      ]);

    const todayEarnings = completedToday.reduce((s, c) => s + (c.totalCost || 0), 0);
    const totalSeconds = completedToday.reduce((s, c) => s + (c.duration || 0), 0);
    const talkTime = `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`;

    const withName = (c) => ({ ...c, displayUsername: resolveUsername(c) });

    return NextResponse.json({
      pendingRequests: pendingCount,
      ongoingCalls: ongoingCount,
      isAvailable: pandit.isAvailable,
      todayCalls: completedToday.length,
      todayEarnings,
      talkTime,
      recentCalls: recent.map(withName),
      calls: todayList.map(withName),
    });
  } catch (err) {
    console.error("Mobile dashboard error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
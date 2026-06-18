import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "pandit") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const pandit = await prisma.pandit.findUnique({
      where: { id: session.user.id },
    });

    if (!pandit) {
      return NextResponse.json(
        { error: "Pandit not found" },
        { status: 404 }
      );
    }

    // ✅ Cleanup stuck calls first
    await prisma.call.updateMany({
      where: {
        panditId: pandit.id,
        status: "ONGOING",
        OR: [
          { endTime: { not: null } },
          { startTime: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
        ],
      },
      data: {
        status: "COMPLETED",
        autoEnded: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calls = await prisma.call.findMany({
      where: { panditId: pandit.id },
      include: { user: true }, // ✅ user can be null (deleted accounts)
      orderBy: { createdAt: "desc" },
    });

    const todayCalls = calls.filter(
      (c) => new Date(c.createdAt) >= today
    );

    const totalMinutesToday = (
      todayCalls.reduce(
        (sum, c) => sum + (c.duration || 0),
        0
      ) / 60
    ).toFixed(1);

    // ✅ Helper to resolve display name, handles deleted users
    const resolveUsername = (call) =>
      call.user?.username || call.deletedUsername || "Deleted User";

    // ✅ Enrich recentCalls with resolved display name
    const recentCalls = calls.slice(0, 10).map((call) => ({
      ...call,
      displayUsername: resolveUsername(call),
    }));

    const allCalls = calls.map((call) => ({
      ...call,
      displayUsername: resolveUsername(call),
    }));

    return NextResponse.json({
      pendingRequests: calls.filter(
        (c) => c.status === "INITIATED" || c.status === "RINGING"
      ).length,
      ongoingCalls: calls.filter(
        (c) => c.status === "ONGOING"
      ).length,
      todayCalls: todayCalls.length,
      totalMinutesToday,
      recentCalls,
      calls: allCalls,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
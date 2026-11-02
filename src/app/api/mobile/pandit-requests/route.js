import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

    const calls = await prisma.call.findMany({
      where: { panditId: pandit.id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        duration: true,
        deletedUsername: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formattedCalls = calls.map((call) => ({
      id: call.id,
      status: call.status,
      createdAt: call.createdAt,
      duration: call.duration,
      displayUsername: call.user?.name || call.deletedUsername || "Deleted User",
    }));

    return NextResponse.json({
      calls: formattedCalls,
      isAvailable: pandit.isAvailable,
    });
  } catch (err) {
    console.error("Mobile Requests:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
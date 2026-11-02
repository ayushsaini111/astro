import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const panditId = searchParams.get("panditId");
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

    const where = {
      status: "STOPPED",
      ...(panditId ? { call: { panditId } } : {}),
    };

    const [recordings, total, pandits] = await Promise.all([
      prisma.recording.findMany({
        where,
        select: {
          callId: true,
          startedAt: true,
          call: {
            select: {
              panditId: true,
              duration: true,
              pandit: { select: { name: true } },
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.recording.count({ where }),
      prisma.pandit.findMany({
        where: { calls: { some: { recording: { status: "STOPPED" } } } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      recordings,
      pandits,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (e) {
    console.error("❌ recordings list error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);
    const viewedParam = searchParams.get("viewed"); // "true" | "false" | null

    const where = {};
    if (viewedParam === "true") where.viewed = true;
    if (viewedParam === "false") where.viewed = false;

    const [requests, total, unviewedCount] = await Promise.all([
      prisma.expertSearchRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expertSearchRequest.count({ where }),
      prisma.expertSearchRequest.count({ where: { viewed: false } }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      unviewedCount,
    });
  } catch (err) {
    console.error("💥 admins/expert-search GET error:", err);
    return NextResponse.json({ error: "Failed to fetch expert search requests" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, viewed } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updated = await prisma.expertSearchRequest.update({
      where: { id },
      data: { viewed: typeof viewed === "boolean" ? viewed : true },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (err) {
    console.error("💥 admins/expert-search PATCH error:", err);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
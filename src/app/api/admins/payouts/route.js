// app/api/admins/payouts/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const panditId = searchParams.get("panditId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    const where = {};
    if (status) where.status = status;
    if (panditId) where.panditId = panditId;

    const [payouts, total] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        include: {
          pandit: { select: { name: true, username: true, phone: true, email: true } },
        },
        orderBy: { requestedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      payouts,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (error) {
    console.error("❌ Get payouts error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
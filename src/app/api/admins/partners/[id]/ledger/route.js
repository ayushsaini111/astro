import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id: partnerId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
    const orderType = searchParams.get("orderType");

    const where = { partnerId, ...(orderType ? { orderType } : {}) };

    const [totalCount, rows] = await Promise.all([
      prisma.commissionLedger.count({ where }),
      prisma.commissionLedger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderType: true,
          orderRefId: true,
          originalAmount: true,
          discountAmount: true,
          commissionAmount: true,
          createdAt: true,
          redeemCode: { select: { code: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      ledger: rows,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    });
  } catch (error) {
    console.error("❌ Admin partner ledger error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
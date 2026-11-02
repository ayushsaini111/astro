import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10")));
    const search = searchParams.get("search")?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { redeemCodes: { some: { code: { contains: search.toUpperCase() } } } },
          ],
        }
      : {};

    const [totalCount, partners] = await Promise.all([
      prisma.partner.count({ where }),
      prisma.partner.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          redeemCodes: { select: { code: true, usageCount: true, discountPercent: true, commissionPercent: true } },
        },
      }),
    ]);

    const partnerIds = partners.map((p) => p.id);

    const [commissionAgg, payoutAgg] = partnerIds.length
      ? await Promise.all([
          prisma.commissionLedger.groupBy({
            by: ["partnerId"],
            where: { partnerId: { in: partnerIds } },
            _sum: { commissionAmount: true },
            _count: true,
          }),
          prisma.partnerPayout.groupBy({
            by: ["partnerId"],
            where: { partnerId: { in: partnerIds }, status: "PAID" },
            _sum: { amount: true },
          }),
        ])
      : [[], []];

    const commissionMap = Object.fromEntries(
      commissionAgg.map((c) => [c.partnerId, { total: c._sum.commissionAmount || 0, count: c._count }])
    );
    const payoutMap = Object.fromEntries(payoutAgg.map((p) => [p.partnerId, p._sum.amount || 0]));

    const data = partners.map((p) => {
      const totalCommission = commissionMap[p.id]?.total || 0;
      const totalPaid = payoutMap[p.id] || 0;
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        isActive: p.isActive,
        codes: p.redeemCodes.map((r) => r.code),
        usageCount: p.redeemCodes.reduce((s, r) => s + r.usageCount, 0),
        totalOrders: commissionMap[p.id]?.count || 0,
        totalCommission,
        totalPaid,
        pending: Math.max(0, totalCommission - totalPaid),
      };
    });

    return NextResponse.json({
      success: true,
      partners: data,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    });
  } catch (error) {
    console.error("❌ Admin partners list error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
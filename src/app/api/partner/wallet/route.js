import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!code || !email) {
      return NextResponse.json({ success: false, error: "Code and email required" }, { status: 400 });
    }

    const redeemCode = await prisma.redeemCode.findFirst({
      where: { code, partner: { email } },
      select: {
        code: true,
        usageCount: true,
        discountPercent: true,
        partnerId: true,
        partner: { select: { name: true, walletBalance: true } },
      },
    });

    if (!redeemCode) {
      return NextResponse.json({ success: false, error: "Invalid code or email" }, { status: 404 });
    }

    const [commissions, totalAgg, payoutAgg, lastPayout] = await Promise.all([
      prisma.commissionLedger.findMany({
        where: { partnerId: redeemCode.partnerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, orderType: true, originalAmount: true, commissionAmount: true, createdAt: true },
      }),
      prisma.commissionLedger.aggregate({
        where: { partnerId: redeemCode.partnerId },
        _sum: { commissionAmount: true },
        _count: true,
      }),
      prisma.partnerPayout.aggregate({
        where: { partnerId: redeemCode.partnerId, status: "PAID" },
        _sum: { amount: true },
      }),
      prisma.partnerPayout.findFirst({
        where: { partnerId: redeemCode.partnerId, status: "PAID" },
        orderBy: { processedAt: "desc" },
        select: { amount: true, processedAt: true },
      }),
    ]);

    const totalCommission = totalAgg._sum.commissionAmount || 0;
    const totalPaid = payoutAgg._sum.amount || 0;

    return NextResponse.json({
      success: true,
      partnerName: redeemCode.partner.name,
      walletBalance: redeemCode.partner.walletBalance,
      code: redeemCode.code,
      usageCount: redeemCode.usageCount,
      totalCommission,
      totalOrders: totalAgg._count,
      totalPaid,
      pendingCommission: Math.max(0, totalCommission - totalPaid),
      lastPayout: lastPayout ? { amount: lastPayout.amount, date: lastPayout.processedAt } : null,
      recentCommissions: commissions,
    });
  } catch (error) {
    console.error("Partner wallet fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
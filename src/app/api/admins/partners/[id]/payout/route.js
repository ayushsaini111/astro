import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const { id: partnerId } = await params;

    const payout = await prisma.$transaction(async (tx) => {
      const [commissionAgg, payoutAgg, partner] = await Promise.all([
        tx.commissionLedger.aggregate({ where: { partnerId }, _sum: { commissionAmount: true } }),
        tx.partnerPayout.aggregate({ where: { partnerId, status: "PAID" }, _sum: { amount: true } }),
        tx.partner.findUnique({ where: { id: partnerId }, select: { id: true } }),
      ]);

      if (!partner) throw new Error("Partner not found");

      const pending = (commissionAgg._sum.commissionAmount || 0) - (payoutAgg._sum.amount || 0);
      if (pending <= 0) throw new Error("No pending commission to pay out");

      return tx.partnerPayout.create({
        data: { partnerId, amount: pending, status: "PAID", processedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true, payout });
  } catch (error) {
    console.error("❌ Admin partner payout error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
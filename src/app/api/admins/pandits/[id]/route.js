// app/api/admins/pandits/[id]/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const pandit = await prisma.pandit.findUnique({
      where: { id },
      include: {
        calls: { where: { status: "COMPLETED" }, select: { totalCost: true, duration: true } },
        payoutRequests: { orderBy: { requestedAt: "desc" } },
      },
    });

    if (!pandit) {
      return NextResponse.json({ success: false, error: "Pandit not found" }, { status: 404 });
    }

    const totalEarnings = pandit.calls.reduce((s, c) => s + (c.totalCost || 0), 0);
    const totalTalkSeconds = pandit.calls.reduce((s, c) => s + (c.duration || 0), 0);
    const totalPaid = pandit.payoutRequests.filter(r => r.status === "PAID").reduce((s, r) => s + r.amount, 0);
    const pendingAmount = pandit.payoutRequests
      .filter(r => r.status === "PENDING" || r.status === "PROCESSING")
      .reduce((s, r) => s + r.amount, 0);

    return NextResponse.json({
      success: true,
      pandit: {
        ...pandit,
        totalEarnings,
        totalTalkSeconds,
        totalCalls: pandit.calls.length,
        totalPaid,
        pendingAmount,
        availableBalance: Math.max(0, totalEarnings - totalPaid - pendingAmount),
        lastPayout: pandit.payoutRequests[0] || null,
      },
      payoutHistory: pandit.payoutRequests,
    });
  } catch (err) {
    console.error("❌ Get pandit detail error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// keep your existing DELETE export below this, unchanged

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const pandit = await prisma.pandit.findUnique({ where: { id } });
    if (!pandit) {
      return NextResponse.json({ success: false, error: "Pandit not found" }, { status: 404 });
    }

    // ✅ Check for existing call history / payout records first
    const [callCount, payoutCount] = await Promise.all([
      prisma.call.count({ where: { panditId: id } }),
      prisma.payoutRequest.count({ where: { panditId: id } }),
    ]);

    if (callCount > 0 || payoutCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete — this pandit has ${callCount} call(s) and ${payoutCount} payout record(s). Historical data must be preserved.`,
        },
        { status: 409 }
      );
    }

    await prisma.pandit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete pandit error:", err);

    // ✅ Catch Prisma FK constraint error as a fallback safety net
    if (err.code === "P2003") {
      return NextResponse.json(
        { success: false, error: "Cannot delete — pandit has related records in the system." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
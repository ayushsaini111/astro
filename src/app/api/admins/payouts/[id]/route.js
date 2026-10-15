// app/api/admins/payouts/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushToPandit } from "@/lib/pushToPandit"; // ✅ reuse your existing pattern

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Payout ID is required" }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required" }, { status: 400 });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        processedAt: status === "PAID" || status === "REJECTED" ? new Date() : null,
      },
      include: {
        pandit: { select: { id: true, name: true } },
      },
    });

    // ✅ NEW — notify pandit instantly when money is redeemed or rejected
    if (status === "PAID" || status === "REJECTED") {
      const title = status === "PAID" ? "💰 Payout Successful" : "Payout Request Update";
      const pushBody =
        status === "PAID"
          ? `₹${updated.amount.toFixed(2)} has been credited to your account.`
          : `Your payout request of ₹${updated.amount.toFixed(2)} was rejected.${
              adminNotes ? ` Reason: ${adminNotes}` : ""
            }`;

      await pushToPandit(updated.panditId, {
        type: "payout_status",
        title,
        body: pushBody,
        data: {
          status,
          amount: updated.amount,
          payoutId: updated.id,
        },
      });
    }

    return NextResponse.json({ success: true, payout: updated });
  } catch (error) {
    console.error("❌ Update payout error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
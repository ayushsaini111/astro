import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { getActiveRedeemCode, computeDiscount } from "@/lib/redeem";

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, redeemCode } = await req.json(); // amount = rupees, from UI quick-select (e.g. 100/200/500)
    if (!amount || amount < 0) {
      return NextResponse.json({ error: "Minimum recharge amount is ₹10" }, { status: 400 });
    }

    const baseAmount = Math.round(Number(amount) * 100); // paise
    const redeem = await getActiveRedeemCode(redeemCode);
    const { payableAmount, discountAmount } = computeDiscount(baseAmount, redeem?.discountPercent ?? 0);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: payableAmount,
      currency: "INR",
      receipt: `wallet_${userId}_${Date.now()}`.slice(0, 40),
      notes: { userId, redeemCode: redeem?.code || "", baseAmount: String(baseAmount) },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      discountApplied: discountAmount > 0,
      discountAmount,
      baseAmount,
    });
  } catch (e) {
    console.error("Wallet recharge order error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
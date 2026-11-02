import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveRedeemCode, computeDiscount, creditCommission } from "@/lib/redeem";
import { sendNotification } from "@/lib/notifications/send";
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      baseAmount, redeemCode, // baseAmount in paise, echoed back from create-order
    } = await req.json();

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Idempotency check
    const existing = await prisma.transaction.findUnique({ where: { idempotencyKey: razorpay_payment_id } });
    if (existing) return NextResponse.json({ success: true, alreadyProcessed: true });

    const redeem = await getActiveRedeemCode(redeemCode);
    const { payableAmount, discountAmount } = computeDiscount(Number(baseAmount), redeem?.discountPercent ?? 0);

    // ✅ Wallet is credited with FULL base amount (buyer's discount is on what they PAY, not what they receive)
    const creditAmountRupees = Number(baseAmount) / 100;

    const wallet = await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0 },
    });

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: creditAmountRupees,
          type: "CREDIT",
          purpose: "WALLET_RECHARGE",
          status: "SUCCESS",
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          idempotencyKey: razorpay_payment_id,
          redeemCode: redeem?.code || null,
        },
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: creditAmountRupees } },
      }),
    ]);

    if (redeem) {
      creditCommission({
        redeemCode: redeem,
        userId,
        orderType: "WALLET_RECHARGE",
        orderRefId: transaction.id,
        originalAmount: Number(baseAmount) / 100,
        discountAmount: discountAmount / 100,
      }).catch((e) => console.error("Commission credit failed:", e));
    }
    sendNotification({
      userId,
      type: "RECHARGE",
      title: "💰 Wallet Recharged",
      body: `₹${creditAmountRupees.toFixed(2)} has been added to your wallet.`,
      data: { transactionId: transaction.id },
    }).catch((e) => console.error("⚠️ Notification send failed (non-fatal):", e));
    return NextResponse.json({ success: true, newBalance: wallet.balance + creditAmountRupees });
  } catch (e) {
    console.error("Wallet verify-payment error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
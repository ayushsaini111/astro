import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(request) {
  try {
    const { userId, razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
      await request.json();

    if (!userId || !razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const body = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // ✅ Fetch the REAL payment amount from Razorpay instead of hardcoding 0
    const razorpay = getRazorpay();
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    const realAmount = paymentDetails.amount; // in paise, e.g. 7900

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // 👇 No row is expected to exist yet (subscribe() no longer creates one).
    // This upsert is what actually BIRTHS the CommunityJoin row — always
    // already ACTIVE, since we only reach here after a real payment succeeded.
    // If the webhook (subscription.charged) raced ahead and already created
    // this row, this just confirms/overwrites the same correct data — safe.
    const updatedJoin = await prisma.communityJoin.upsert({
      where: { userId },
      update: {
        razorpaySubscriptionId: razorpay_subscription_id,
        status: "ACTIVE",
        amount: realAmount,
        currentStart: now,
        currentEnd: nextMonth,
        lastChargedAt: now,
      },
      create: {
        userId,
        razorpaySubscriptionId: razorpay_subscription_id,
        status: "ACTIVE",
        amount: realAmount,
        currentStart: now,
        currentEnd: nextMonth,
        lastChargedAt: now,
      },
    });

    await prisma.communityPayment.upsert({
      where: { razorpayPaymentId: razorpay_payment_id },
      update: { amount: realAmount, status: "SUCCESS" },
      create: {
        communityJoinId: updatedJoin.id,
        razorpayPaymentId: razorpay_payment_id,
        amount: realAmount,
        status: "SUCCESS",
      },
    });

    try {
      const { sendNotification } = await import("@/lib/notifications/send");
      await sendNotification({
        userId,
        type: "COMMUNITY_JOINED",
        title: "🎉 Welcome to the Community!",
        body: `₹${(realAmount / 100).toFixed(2)} charged successfully. Your membership is now active.`,
        data: {},
      });
    } catch (notifErr) {
      console.error("Non-fatal notification error:", notifErr);
    }

    return NextResponse.json({
      status: updatedJoin.status,
      joinedAt: updatedJoin.joinedAt,
      currentEnd: updatedJoin.currentEnd,
    });
  } catch (err) {
    console.error("💥 community/verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
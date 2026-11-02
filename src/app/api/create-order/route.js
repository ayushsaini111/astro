import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { getActiveRedeemCode, computeDiscount } from "@/lib/redeem"; // ✅ NEW

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials not found");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function POST(request) {
  try {
    const { amount, currency, poojaId, poojaTitle, redeemCode } = await request.json(); // ✅ redeemCode

    if (!amount || !poojaId || !poojaTitle) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ validate code + compute discount on the amount already sent by client
    const redeem = await getActiveRedeemCode(redeemCode);
    const { payableAmount, discountAmount } = computeDiscount(Math.round(amount), redeem?.discountPercent ?? 0);

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: payableAmount, // ✅ discounted
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}_${poojaId}`,
      notes: {
        poojaId: poojaId.toString(),
        poojaTitle,
        redeemCode: redeem?.code || "", // ✅
      },
    });

    return NextResponse.json({
      success: true,
      order,
      discountApplied: discountAmount > 0, // ✅
      discountAmount,                      // ✅
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
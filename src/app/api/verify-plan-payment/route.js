import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return { 
    id: userId,
    email: request.headers.get('x-user-email'),
    name: request.headers.get('x-user-name'),
  };
}

export async function POST(request) {
  try {
    const user = getUserFromHeaders(request);
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planDetails,
    } = body;

    // Verify Razorpay signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Check if plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planDetails.planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { success: false, message: "Plan not found or inactive" },
        { status: 404 }
      );
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: planDetails.price / 100, // Convert paise to rupees
        type: "RECHARGE",
        purpose: `Talk Time Plan: ${planDetails.planName}`,
        status: "SUCCESS",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    // Calculate end date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.validDays);

    // Create or update user plan
    const userPlan = await prisma.userPlan.create({
      data: {
        userId: user.id,
        planId: plan.id,
        remainingSeconds: plan.seconds,
        perDayUsedSeconds: 0,
        lastUsedDate: null,
        startDate: new Date(),
        endDate,
        isActive: true,
      },
    });

    console.log(`Plan activated for user ${user.id}:`, userPlan.id);

    return NextResponse.json({
      success: true,
      message: "Plan activated successfully",
      plan: {
        id: userPlan.id,
        name: plan.name,
        remainingSeconds: userPlan.remainingSeconds,
        endDate: userPlan.endDate,
        validDays: plan.validDays,
      },
      transaction: {
        id: transaction.id,
      },
    });
  } catch (error) {
    console.error("Verify plan payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
    const { planId, planName, price, seconds, validDays, perDayLimit } = body;

    if (!planId || !planName || !price) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: parseInt(price), // price in paise
      currency: "INR",
      receipt: `PLAN_${Date.now()}_${planId}`,
      notes: {
        planId: planId.toString(),
        planName,
        seconds: seconds || 0,
        validDays: validDays || 30,
        perDayLimit: perDayLimit || null,
        userId: user.id,
      },
    });

    console.log("Plan order created:", order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("Create plan order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
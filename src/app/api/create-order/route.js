// app/api/create-order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay
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
    const { amount, currency, poojaId, poojaTitle } = await request.json();

    if (!amount || !poojaId || !poojaTitle) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const razorpay = getRazorpay();

    const options = {
      amount: Math.round(amount), // amount in paise
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}_${poojaId}`,
      notes: {
        poojaId: poojaId.toString(),
        poojaTitle,
      },
    };

    console.log("Creating Razorpay order:", options);

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

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
      amount: amount, // amount in paise
      currency: currency || "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        poojaId: poojaId.toString(),
        poojaTitle,
      },
    };

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
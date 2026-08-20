// src/app/backend/create-product-order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return { id: userId };
}

export async function POST(request) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount,
      currency,
      productId,
      productTitle,
      productImage,
      quantity,
      unitPrice
    } = body;

    if (!amount || !productId || !productTitle) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const order = await razorpay.orders.create({
      amount: parseInt(amount), // amount in paise
      currency: currency || "INR",
      receipt: `PROD_${Date.now()}_${productId}`,
      notes: {
        productId: productId.toString(),
        productTitle,
        productImage: productImage || "",
        quantity: (quantity || 1).toString(),
        unitPrice: (unitPrice || 0).toString(),
        userId: user.id,
      },
    });

    console.log("✅ Razorpay order created:", order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("❌ Create product order error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
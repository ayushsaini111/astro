import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return { id: userId };
}

// ✅ CREATE SINGLE PRODUCT ORDER
export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'verify') {
    return handleVerify(request);
  }

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
      unitPrice,
      shuddhikaranRequested,
      shuddhikaranAmount,
    } = body;

    if (!amount || !productId || !productTitle) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ FIX: Shorten receipt to under 56 chars
    const timestamp = Date.now();
    const shortId = productId.substring(0, 8); // First 8 chars of UUID
    const receipt = `APP_${timestamp}_${shortId}`; // Max ~30 chars

    const order = await razorpay.orders.create({
      amount: parseInt(amount),
      currency: currency || "INR",
      receipt,
      notes: {
        productId: productId.toString(),
        productTitle,
        quantity: (quantity || 1).toString(),
        unitPrice: (unitPrice || 0).toString(),
        shuddhikaranRequested: shuddhikaranRequested ? "true" : "false",
        shuddhikaranAmount: (shuddhikaranAmount || 0).toString(),
        userId: user.id,
        source: "APP",
      },
    });

    console.log("✅ [APP] Single product order created:", order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("❌ [APP] Create order error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ VERIFY SINGLE PRODUCT PAYMENT
async function handleVerify(request) {
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
      userDetails,
      deliveryLocation,
      productDetails,
      shuddhikaranRequested = false,
      shuddhikaranAmount = 0,
    } = body;

    // Verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("❌ [APP] Invalid signature");
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    console.log("✅ [APP] Payment signature verified");

    const orderId = `ORD${Date.now().toString().slice(-10)}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const orderData = {
      orderId,
      userId: user.id,
      productId: productDetails.productId,
      productTitle: productDetails.productTitle,
      productImage: productDetails.productImage || null,
      quantity: parseInt(productDetails.quantity) || 1,
      unitPrice: parseFloat(productDetails.unitPrice) || 0,
      totalAmount: parseFloat(productDetails.totalPrice) || 0,
      shuddhikaranRequested: shuddhikaranRequested || false,
      shuddhikaranAmount: parseFloat(shuddhikaranAmount || 0),
      customerName: userDetails.name || "",
      customerPhone: userDetails.phone || "",
      customerEmail: userDetails.email || "",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: "SUCCESS",
      status: "CONFIRMED",
      deliveryStatus: "PENDING",
      estimatedDelivery,
      specialRequests: userDetails.specialRequests || null,
      addressType: deliveryLocation?.type === "coordinates" ? "GPS" : "MANUAL",
      latitude: deliveryLocation?.latitude || null,
      longitude: deliveryLocation?.longitude || null,
      fullAddress: deliveryLocation?.fullAddress || "",
      houseNo: userDetails.houseNo || null,
      address: userDetails.address || deliveryLocation?.fullAddress || null,
      landmark: userDetails.landmark || null,
      pinCode: userDetails.pinCode || null,
    };

    const order = await prisma.order.create({
      data: orderData,
    });

    console.log("✅ [APP] Order created:", order.orderId);

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: productDetails.productId,
        quantity: parseInt(productDetails.quantity) || 1,
        price: parseFloat(productDetails.unitPrice) || 0,
      },
    });

    console.log("✅ [APP] OrderItem created");

    // Update user profile if needed
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, provider: true },
    });

    if (existingUser && (!existingUser.phone || existingUser.provider === "GOOGLE")) {
      const updateData = {};
      if (userDetails.name) updateData.name = userDetails.name;
      if (userDetails.email) updateData.email = userDetails.email;
      if (userDetails.phone) updateData.phone = userDetails.phone;

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        console.log("✅ [APP] User profile updated");
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order: {
        orderId: order.orderId,
        id: order.id,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        estimatedDelivery: order.estimatedDelivery,
        totalAmount: order.totalAmount,
      },
    });
  } catch (error) {
    console.error("❌ [APP] Verify payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
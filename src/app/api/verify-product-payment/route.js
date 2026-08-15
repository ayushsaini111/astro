import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userDetails,
      deliveryLocation,
      productDetails,
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

    // Generate unique order ID
    const orderId = `ORD${Date.now().toString().slice(-10)}`;

    // Calculate estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // Create order in database
    const order = await prisma.order.create({
      data: {
        orderId,
        userId: user.id,
        productId: productDetails.productId,
        productTitle: productDetails.productTitle,
        productImage: productDetails.productImage,
        quantity: productDetails.quantity,
        unitPrice: productDetails.unitPrice,
        totalAmount: productDetails.totalPrice,
        customerName: userDetails.name,
        customerPhone: userDetails.phone,
        customerEmail: userDetails.email,
        addressType: deliveryLocation.type,
        latitude: deliveryLocation.latitude,
        longitude: deliveryLocation.longitude,
        fullAddress: deliveryLocation.fullAddress,
        houseNo: userDetails.houseNo || null,
        address: userDetails.address || null,
        landmark: userDetails.landmark || null,
        pinCode: userDetails.pinCode || null,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: "SUCCESS",
        status: "CONFIRMED",
        deliveryStatus: "CONFIRMED",
        estimatedDelivery,
        specialRequests: userDetails.specialRequests || null,
      },
    });

    // Update user profile
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: userDetails.name || undefined,
        email: userDetails.email || undefined,
        phone: userDetails.phone || undefined,
        houseNo: userDetails.houseNo || undefined,
        address: userDetails.address || undefined,
        landmark: userDetails.landmark || undefined,
        pinCode: userDetails.pinCode || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        orderId: order.orderId,
        id: order.id,
        estimatedDelivery: order.estimatedDelivery,
      },
    });
  } catch (error) {
    console.error("Verify product payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
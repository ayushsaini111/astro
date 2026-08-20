// src/app/backend/verify-product-payment/route.js
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

    // ── Step 1: Verify Razorpay signature ──────────────────────────
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("❌ Invalid signature");
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    console.log("✅ Payment signature verified");

    // ── Step 2: Generate unique order ID ───────────────────────────
    const orderId = `ORD${Date.now().toString().slice(-10)}`;

    // ── Step 3: Calculate estimated delivery (7 days) ──────────────
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // ── Step 4: Prepare order data ─────────────────────────────────
    const orderData = {
      orderId,
      userId: user.id,
      
      // Product details
      productId: productDetails.productId,
      productTitle: productDetails.productTitle,
      productImage: productDetails.productImage || null,
      quantity: parseInt(productDetails.quantity) || 1,
      unitPrice: parseFloat(productDetails.unitPrice) || 0,
      totalAmount: parseFloat(productDetails.totalPrice) || 0,
      
      // Customer details
      customerName: userDetails.name || "",
      customerPhone: userDetails.phone || "",
      customerEmail: userDetails.email || "",
      
      // Payment details
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: "SUCCESS",
      
      // Order status
      status: "CONFIRMED",
      deliveryStatus: "PENDING", // ✅ Changed from CONFIRMED to PENDING
      
      // Delivery info
      estimatedDelivery,
      specialRequests: userDetails.specialRequests || null,
      
      // Address details - handle both GPS and manual
      addressType: deliveryLocation.type === "coordinates" ? "GPS" : "MANUAL",
      latitude: deliveryLocation.latitude || null, // ✅ Allow null
      longitude: deliveryLocation.longitude || null, // ✅ Allow null
      fullAddress: deliveryLocation.fullAddress || "",
      houseNo: userDetails.houseNo || null,
      address: userDetails.address || null,
      landmark: userDetails.landmark || null,
      pinCode: userDetails.pinCode || null,
    };

    // ── Step 5: Create order in database ───────────────────────────
    const order = await prisma.order.create({
      data: orderData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    console.log("✅ Order created:", order.orderId);

    // ── Step 6: Create OrderItem entry ─────────────────────────────
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: productDetails.productId,
        quantity: parseInt(productDetails.quantity) || 1,
        price: parseFloat(productDetails.unitPrice) || 0,
      },
    });

    console.log("✅ OrderItem created");

    // ── Step 7: Update user profile (if new info provided) ─────────
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { phone: true, provider: true },
    });

    // Only update if phone is missing (Google login users)
    if (existingUser && (!existingUser.phone || existingUser.provider === "GOOGLE")) {
      const updateData = {};
      
      if (userDetails.name) updateData.name = userDetails.name;
      if (userDetails.email) updateData.email = userDetails.email;
      if (userDetails.phone) updateData.phone = userDetails.phone;
      if (userDetails.houseNo) updateData.houseNo = userDetails.houseNo;
      if (userDetails.address) updateData.address = userDetails.address;
      if (userDetails.landmark) updateData.landmark = userDetails.landmark;
      if (userDetails.pinCode) updateData.pinCode = userDetails.pinCode;

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        console.log("✅ User profile updated");
      }
    }

    // ── Step 8: Return success response ────────────────────────────
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
    console.error("❌ Verify product payment error:", error);
    
    // Better error handling
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: "Duplicate order detected" },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { success: false, message: "Invalid product or user reference" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
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

// ✅ CREATE BULK ORDER
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
    const { amount, currency, items } = body;

    if (!amount || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ FIX: Shorten receipt to under 56 chars
    const timestamp = Date.now();
    const shortUserId = user.id.substring(0, 8);
    const receipt = `BULK_${timestamp}_${shortUserId}`; // Max ~30 chars

    const order = await razorpay.orders.create({
      amount: parseInt(amount),
      currency: currency || "INR",
      receipt,
      notes: {
        userId: user.id,
        itemCount: items.length.toString(),
        type: "BULK_ORDER",
        source: "APP",
      },
    });

    console.log("✅ [APP] Bulk order created:", {
      orderId: order.id,
      amount: order.amount / 100,
      itemCount: items.length,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      itemCount: items.length,
    });
  } catch (error) {
    console.error("❌ [APP] Create bulk order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

// ✅ VERIFY BULK PAYMENT
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
      items,
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

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    // Create all orders in transaction
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];

      for (const item of items) {
        const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        await new Promise(resolve => setTimeout(resolve, 1));

        const orderData = {
          orderId,
          userId: user.id,
          productId: item.productId,
          productTitle: item.productTitle,
          productImage: item.productImage || null,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          totalAmount: parseFloat(item.itemTotal) || 0,
          shuddhikaranRequested: item.shuddhikaranRequested || false,
          shuddhikaranAmount: parseFloat(item.shuddhikaranAmount || 0),
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
          addressType: deliveryLocation.type === "coordinates" ? "GPS" : "MANUAL",
          latitude: deliveryLocation.latitude || null,
          longitude: deliveryLocation.longitude || null,
          fullAddress: deliveryLocation.fullAddress || "",
          houseNo: deliveryLocation.houseNo || null,
          address: deliveryLocation.fullAddress || null,
          landmark: deliveryLocation.landmark || null,
          pinCode: deliveryLocation.pinCode || null,
        };

        const order = await tx.order.create({ data: orderData });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: parseInt(item.quantity) || 1,
            price: parseFloat(item.unitPrice) || 0,
          },
        });

        orders.push(order);
      }

      return orders;
    });

    console.log(`✅ [APP] ${createdOrders.length} orders created`);

    // Update user profile
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
      message: `${createdOrders.length} orders created successfully`,
      orders: createdOrders.map((o) => ({
        orderId: o.orderId,
        productTitle: o.productTitle,
        productImage: o.productImage,
        quantity: o.quantity,
        unitPrice: o.unitPrice,
        totalPrice: o.totalAmount,
        shuddhikaranRequested: o.shuddhikaranRequested,
        shuddhikaranAmount: o.shuddhikaranAmount,
        deliveryStatus: o.deliveryStatus,
        estimatedDelivery: o.estimatedDelivery,
      })),
      orderIds: createdOrders.map((o) => o.orderId),
    });
  } catch (error) {
    console.error("❌ [APP] Verify bulk payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
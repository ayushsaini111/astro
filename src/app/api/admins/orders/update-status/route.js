// src/app/api/admins/orders/update-status/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      status,
      deliveryStatus,
      paymentStatus,
      estimatedDelivery,
      trackingNote,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const updateData = {};

    if (status) updateData.status = status;
    if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (estimatedDelivery)
      updateData.estimatedDelivery = new Date(estimatedDelivery);

    // Auto-set timestamps
    if (deliveryStatus === "DELIVERED" || status === "DELIVERED") {
      updateData.deliveredAt = new Date();
      updateData.status = "DELIVERED";
      updateData.deliveryStatus = "DELIVERED";

      // ✅ Mark all deliveries as completed when order is delivered
      await prisma.delivery.updateMany({
        where: { 
          orderId,
          status: { not: "DELIVERED" }
        },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });
    }

    if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      
      // ✅ Remove delivery assignments if order is cancelled
      await prisma.delivery.deleteMany({
        where: { orderId }
      });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("❌ Update order error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
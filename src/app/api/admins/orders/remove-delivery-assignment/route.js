// src/app/api/admins/orders/remove-delivery-assignment/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, deliveryId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    // Remove delivery assignment
    if (deliveryId) {
      await prisma.delivery.delete({
        where: { id: deliveryId }
      });
    } else {
      // Remove all deliveries for this order
      await prisma.delivery.deleteMany({
        where: { orderId }
      });
    }

    // Update order delivery status back to pending
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Delivery assignment removed successfully",
    });
  } catch (error) {
    console.error("❌ Remove delivery assignment error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
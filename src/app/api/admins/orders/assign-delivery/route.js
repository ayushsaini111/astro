// src/app/api/admins/orders/assign-delivery/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, partnerId } = body;

    if (!orderId || !partnerId) {
      return NextResponse.json(
        { success: false, error: "orderId and partnerId are required" },
        { status: 400 }
      );
    }

    // ✅ Check if partner is available before assigning
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "Delivery partner not found" },
        { status: 404 }
      );
    }

    if (!partner.isAvailable) {
      return NextResponse.json(
        { success: false, error: "Delivery partner is not available" },
        { status: 400 }
      );
    }

    // Create delivery assignment
    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        partnerId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: {
        partner: true,
      },
    });

    // Update order delivery status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: "CONFIRMED",
        status: "PROCESSING",
      },
    });

    return NextResponse.json({
      success: true,
      delivery,
      message: "Delivery partner assigned successfully",
    });
  } catch (error) {
    console.error("❌ Assign delivery error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
// src/app/api/admins/orders/delivery-partners/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    
    const { name, phone, vehicleType, isAvailable } = body;

    if (!name || !phone || !vehicleType) {
      return NextResponse.json(
        { success: false, error: "name, phone, vehicleType are required" },
        { status: 400 }
      );
    }

    const partner = await prisma.deliveryPartner.update({
      where: { id },
      data: { 
        name, 
        phone, 
        vehicleType, 
        isAvailable: isAvailable ?? true 
      },
      include: {
        deliveries: {
          where: { status: { not: "DELIVERED" } },
          select: {
            id: true,
            orderId: true,
            status: true,
            assignedAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      partner,
      message: "Partner updated successfully",
    });
  } catch (error) {
    console.error("❌ Update delivery partner error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if partner has active deliveries
    const activeDeliveries = await prisma.delivery.count({
      where: {
        partnerId: id,
        status: { not: "DELIVERED" }
      }
    });

    if (activeDeliveries > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete partner. Has ${activeDeliveries} active deliveries.` 
        },
        { status: 400 }
      );
    }

    await prisma.deliveryPartner.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Partner deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete delivery partner error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
// src/app/api/admins/orders/delivery-partners/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const partners = await prisma.deliveryPartner.findMany({
      // ✅ REMOVED the where filter to show ALL partners
      include: {
        deliveries: {
          where: {
            status: { not: "DELIVERED" },
          },
          select: {
            id: true,
            orderId: true,
            status: true,
            assignedAt: true,
          },
        },
      },
      orderBy: [
        { isAvailable: "desc" }, // ✅ Show available partners first
        { name: "asc" }
      ],
    });

    return NextResponse.json({ success: true, partners });
  } catch (error) {
    console.error("❌ Get delivery partners error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, vehicleType, isAvailable = true } = body;

    if (!name || !phone || !vehicleType) {
      return NextResponse.json(
        { success: false, error: "name, phone, vehicleType are required" },
        { status: 400 }
      );
    }

    const partner = await prisma.deliveryPartner.create({
      data: { name, phone, vehicleType, isAvailable },
      include: {
        deliveries: {
          where: { status: { not: "DELIVERED" } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      partner,
      message: "Delivery partner created",
    });
  } catch (error) {
    console.error("❌ Create delivery partner error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
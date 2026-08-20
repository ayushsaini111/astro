// src/app/api/admins/orders/get-single/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const id = searchParams.get("id");

    if (!orderId && !id) {
      return NextResponse.json(
        { success: false, error: "orderId or id is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: id ? { id } : { orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profilePic: true,
            address: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("❌ Get single order error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
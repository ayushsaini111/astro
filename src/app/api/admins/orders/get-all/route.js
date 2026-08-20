// src/app/api/admins/orders/get-all/route.js - Simple version
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status") || "ALL";
    const deliveryStatus = searchParams.get("deliveryStatus") || "ALL";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = {};
    if (userId) where.userId = userId;
    if (status !== "ALL") where.status = status;
    if (deliveryStatus !== "ALL") where.deliveryStatus = deliveryStatus;

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { orderId: { contains: search, mode: "insensitive" } },
        { productTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ Simple query without relations causing issues
    const [orders, total, deliveries, partners] = await Promise.all([
      // Get orders
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, profilePic: true },
          },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      
      // Get total count
      prisma.order.count({ where }),
      
      // Get deliveries separately
      prisma.delivery.findMany({
        where: { status: { not: "DELIVERED" } },
        include: {
          partner: {
            select: { id: true, name: true, vehicleType: true, phone: true }
          }
        }
      }),
      
      // Get partners
      prisma.deliveryPartner.findMany({
        include: {
          deliveries: {
            where: { status: { not: "DELIVERED" } },
            select: { id: true, orderId: true, status: true, assignedAt: true },
          },
        },
      })
    ]);

    // ✅ Manually attach deliveries to orders
    const ordersWithDeliveries = orders.map(order => ({
      ...order,
      deliveries: deliveries.filter(d => d.orderId === order.id)
    }));

    // Get stats
    const [statusStats, deliveryStats, revenueResult] = await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.order.groupBy({ by: ["deliveryStatus"], _count: { deliveryStatus: true } }),
      prisma.order.aggregate({ where: { paymentStatus: "SUCCESS" }, _sum: { totalAmount: true } }),
    ]);

    return NextResponse.json({
      success: true,
      orders: ordersWithDeliveries,
      partners,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: statusStats,
        byDelivery: deliveryStats,
        totalRevenue: revenueResult._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));

    const [totalCount, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
    });
  } catch (error) {
    console.error("❌ Notifications fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId required" }, { status: 400 });
    }

    await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Notification update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true") {
      await prisma.notification.deleteMany({ where: { userId } });
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }

    await prisma.notification.deleteMany({ where: { id: notificationId, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
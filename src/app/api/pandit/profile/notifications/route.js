// app/api/pandit/profile/notifications/route.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    // Map notification keys to database fields
    const fieldMap = {
      consultationRequests: "notificationsConsultationRequests",
      messages: "notificationsMessages",
      reminders: "notificationsReminders",
      promotions: "notificationsPromotions",
    };

    const data = {};
    Object.entries(body).forEach(([key, value]) => {
      const dbField = fieldMap[key];
      if (dbField) {
        data[dbField] = value;
      }
    });

    const updated = await prisma.pandit.update({
      where: { id: session.user.id },
      data,
      select: {
        notificationsConsultationRequests: true,
        notificationsMessages: true,
        notificationsReminders: true,
        notificationsPromotions: true,
      },
    });

    console.log("✅ Notifications updated for:", session.user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("❌ Notifications update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function PATCH(req) {
  try {
    // -------------------------
    // Verify JWT
    // -------------------------
    const auth = req.headers.get("authorization");

    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    let payload;

    try {
      payload = jwt.verify(
        token,
        process.env.NEXTAUTH_SECRET
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid Token" },
        { status: 401 }
      );
    }

    // -------------------------
    // Body
    // -------------------------
    const body = await req.json();

    const {
      consultationRequests,
      messages,
      reminders,
      promotions,
    } = body;

    const updateData = {};

    if (consultationRequests !== undefined)
      updateData.notificationsConsultationRequests =
        consultationRequests;

    if (messages !== undefined)
      updateData.notificationsMessages = messages;

    if (reminders !== undefined)
      updateData.notificationsReminders = reminders;

    if (promotions !== undefined)
      updateData.notificationsPromotions = promotions;

    const updated = await prisma.pandit.update({
      where: {
        id: payload.id,
      },
      data: updateData,
      select: {
        notificationsConsultationRequests: true,
        notificationsMessages: true,
        notificationsReminders: true,
        notificationsPromotions: true,
      },
    });

    return NextResponse.json({
      success: true,
      notifications: updated,
    });
  } catch (err) {
    console.log(err);

    return NextResponse.json(
      {
        error: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
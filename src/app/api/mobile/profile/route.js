// app/api/mobile/profile/route.js

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
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
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const pandit = await prisma.pandit.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        dob: true,
        about: true,
        profilePic: true,
        profilePicPublicId: true,
        speciality: true,
        languages: true,
        ratePerMin: true,
        isAvailable: true,
        startTime: true,
        endTime: true,
        breakTime: true,
        workingDays: true,
        notificationsConsultationRequests: true,
        notificationsMessages: true,
        notificationsReminders: true,
        notificationsPromotions: true,
        createdAt: true,
      },
    });
const completedConsultations = await prisma.call.count({
  where: {
    panditId: pandit.id,
    status: "COMPLETED",
  },
});

const totalTalk = await prisma.call.aggregate({
  where: {
    panditId: pandit.id,
    status: "COMPLETED",
  },
  _sum: {
    duration: true,
  },
});
    if (!pandit) {
      return NextResponse.json(
        { error: "Pandit not found" },
        { status: 404 }
      );
    }
    console.log(pandit);

 return NextResponse.json({
  ...pandit,

  stats: {
    consultations: completedConsultations,
    totalTalkSeconds: totalTalk._sum.duration || 0,
  },
});

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
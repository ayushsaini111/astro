import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    console.log("🔥 SAVE FCM TOKEN API HIT");

    const auth = req.headers.get("authorization");
    console.log("Authorization:", auth);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = auth.replace("Bearer ", "");

    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET
    );

    console.log("Decoded User:", decoded);

    const body = await req.json();
    console.log("Body:", body);

    const { fcmToken } = body;

    if (!fcmToken) {
      return NextResponse.json(
        { error: "FCM Token missing" },
        { status: 400 }
      );
    }

    await prisma.pandit.update({
      where: {
        id: decoded.id,
      },
      data: {
        fcmToken,
      },
    });

    console.log("✅ FCM TOKEN SAVED");

    return NextResponse.json({
      success: true,
    });

  } catch (err) {
    console.log("❌ SAVE TOKEN ERROR");
    console.log(err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
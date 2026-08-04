// backend/src/app/api/auth/verifyotps/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyOTP } from "@/lib/twilio";

// ✅ Handle OPTIONS (preflight) requests
export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req) {
  try {
    const { phone, otp } = await req.json();

    console.log("🔐 Verify OTP request for:", phone, "OTP:", otp);

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required." },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    if (otp.length !== 6) {
      return NextResponse.json(
        { error: "Invalid OTP." },
        { status: 400 }
      );
    }

    // Verify with Twilio
    const verification = await verifyOTP(phone, otp);

    console.log("📱 Twilio verification status:", verification.status);

    if (verification.status !== "approved") {
      return NextResponse.json(
        { error: "Incorrect OTP." },
        { status: 400 }
      );
    }

    // Check existing user
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    console.log("👤 User found:", user ? "Yes" : "No");

    // Delete old verification tokens
    await prisma.oTPVerification.deleteMany({
      where: { identifier: phone },
    });

    // Generate login token
    const verifiedToken = crypto.randomBytes(32).toString("hex");

    // Save temporary verification
    await prisma.oTPVerification.create({
      data: {
        identifier: phone,
        otp: verifiedToken,
        verified: true,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        userId: user?.id,
      },
    });

    console.log("✅ OTP verified successfully for:", phone);

    return NextResponse.json({
      success: true,
      verifiedToken,
      isNewUser: !user,
    });
  } catch (error) {
    console.error("❌ Verify OTP error:", error);

    return NextResponse.json(
      { error: error.message || "OTP verification failed." },
      { status: 500 }
    );
  }
}
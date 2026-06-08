import { verifyOTP } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  const { phone, otp } = await req.json();

  const result = await verifyOTP(phone, otp);
  if (result.status !== "approved") {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone, username: null, isVerified: true },
  });

  // Store a short-lived token in your existing OTPVerification model
  const verifiedToken = crypto.randomBytes(32).toString("hex");
  await prisma.oTPVerification.create({
    data: {
      identifier: phone,
      otp: verifiedToken,
      verified: true,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 min
      userId: user.id,
    },
  });

  return NextResponse.json({
    success: true,
    verifiedToken,
    redirect: !user.username ? "/username" : "/",
  });
}
// OLD project: app/api/auth/onboarding/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { name, dob, phone, token, userId, userEmail } = await req.json();

    if (!name?.trim() || !dob) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // PATH A: OTP new user
    if (phone && token) {
      const verification = await prisma.oTPVerification.findFirst({
        where: {
          identifier: phone,
          otp: token,
          verified: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (!verification) {
        return NextResponse.json({ error: "Session expired. Please login again." }, { status: 401 });
      }

      const user = await prisma.user.upsert({
        where: { phone },
        update: { name: name.trim(), dob: new Date(dob), hasCompletedOnboarding: true },
        create: { phone, name: name.trim(), dob: new Date(dob), hasCompletedOnboarding: true, isVerified: true },
      });

      // ✅ Generate a fresh token for signIn after onboarding
      const freshToken = crypto.randomBytes(32).toString("hex");
      await prisma.oTPVerification.create({
        data: {
          identifier: phone,
          otp: freshToken,
          verified: true,
          expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 min
          userId: user.id,
        },
      });

      return NextResponse.json({ success: true, userId: user.id, freshToken }); // ✅ return freshToken
    }

    // PATH B: Google user
    let resolvedUserId = userId ?? null;

    if (!resolvedUserId && userEmail) {
      const existing = await prisma.user.findUnique({ where: { email: userEmail } });
      resolvedUserId = existing?.id ?? null;
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.upsert({
      where: { id: resolvedUserId },
      update: { name: name.trim(), dob: new Date(dob), hasCompletedOnboarding: true },
      create: {
        id: resolvedUserId,
        email: userEmail ?? null,
        name: name.trim(),
        dob: new Date(dob),
        hasCompletedOnboarding: true,
        isVerified: true,
      },
    });

    return NextResponse.json({ success: true, userId: resolvedUserId });

  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
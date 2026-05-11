import { verifyOTP } from "@/lib/twilio";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  const { phone, otp } = await req.json();

  const result = await verifyOTP(phone, otp);

  if (result.status !== "approved") {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: {
      phone,
      username: null,
      isVerified: true,
    },
  });

  // ✅ Call cookies() to get the store
  const cookieStore = await cookies();
  cookieStore.set("userId", user.id, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
  });

  if (!user.username || !user.dob) {
    return NextResponse.json({ redirect: "/username" });
  }

  return NextResponse.json({ redirect: "/home" });
}
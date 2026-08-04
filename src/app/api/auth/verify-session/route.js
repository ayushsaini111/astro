import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { phone, token } = await req.json();

  const record = await prisma.oTPVerification.findFirst({
    where: {
      identifier: phone,
      otp: token,
      verified: true,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!record?.user) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  await prisma.oTPVerification.update({
    where: { id: record.id },
    data: { expiresAt: new Date(0) },
  });

  return NextResponse.json({ user: record.user });
}
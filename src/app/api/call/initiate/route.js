// api/call/initiate/route.js

import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function POST(req) {
  // ✅ Support both OTP (cookie) and Google (NextAuth session)
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  
  const userId = session?.user?.id ?? cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { panditId } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.username || !user.dob) {
    return NextResponse.json({ error: "INCOMPLETE_PROFILE" }, { status: 403 });
  }

  await prisma.call.updateMany({
    where: { userId, panditId, status: "INITIATED" },
    data: { status: "FAILED" },
  });

  const channelName = `ch${randomBytes(8).toString("hex")}`;
  const uid = Math.floor(Math.random() * 100000);
  const token = generateAgoraToken(channelName, uid);

  const call = await prisma.call.create({
    data: {
      userId,
      panditId,
      channelName,
      agoraToken: token,
      type: "VOICE",
      billingType: "PLAN",
      ratePerMinute: 0,
      status: "INITIATED",
    },
  });

  return NextResponse.json({
    callId: call.id,
    channelName,
    token,
    appId: process.env.AGORA_APP_ID,
    uid,
    planMinutesLeft: 999,
  });
}
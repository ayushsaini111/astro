import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
  // ✅ Try NextAuth session first (Google/pandit), fallback to cookie (OTP users)
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("userId")?.value;

  // Pandit must be authenticated via Google session
  const panditEmail = session?.user?.email;
  const isOtpUser = !panditEmail && !!cookieUserId;

  if (!panditEmail && !cookieUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If OTP user somehow hits this route, block them — only pandits allowed here
  if (isOtpUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify this email is actually a pandit
  const pandit = await prisma.pandit.findUnique({
    where: { email: panditEmail },
  });

  if (!pandit) {
    return NextResponse.json({ error: "Not a pandit" }, { status: 403 });
  }

  const { callId } = await req.json();

  if (!callId) {
    return NextResponse.json({ error: "Missing callId" }, { status: 400 });
  }

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      user: {
        select: { username: true, dob: true },
      },
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const uid = Math.floor(Math.random() * 100000);
  const token = generateAgoraToken(call.channelName, uid);

  await prisma.call.update({
    where: { id: callId },
    data: {
      status: "RINGING",
      agoraToken: token,
    },
  });

  return NextResponse.json({
    callId: call.id,
    channelName: call.channelName,
    token,
    uid,
    appId: process.env.AGORA_APP_ID,
    user: call.user,
  });
}
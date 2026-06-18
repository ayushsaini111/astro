import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { sendEvent } from "@/lib/sse";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "pandit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pandit = await prisma.pandit.findUnique({ where: { id: session.user.id } });
  if (!pandit) return NextResponse.json({ error: "Not a pandit" }, { status: 403 });

  const { callId } = await req.json();
  if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { user: { select: { username: true, dob: true } } },
  });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const uid = Math.floor(Math.random() * 100000);
  const token = generateAgoraToken(call.channelName, uid);
  const now = new Date();

  await prisma.call.update({
    where: { id: callId },
    data: { status: "RINGING", agoraToken: token, startTime: now },
  });

  // ✅ Push to user via SSE — no more user polling
  sendEvent(`user-${call.userId}`, "call-ringing", {
    callId: call.id,
    channelName: call.channelName,
    token,
    uid,
    appId: process.env.AGORA_APP_ID,
    pandit: { name: pandit.name, speciality: pandit.speciality, profilePic: pandit.profilePic },
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
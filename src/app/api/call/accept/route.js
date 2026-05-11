import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    // ✅ Try cookie first (OTP users)
    const cookieStore = await cookies();
    let userId = cookieStore.get("userId")?.value;

    // ✅ Fallback to NextAuth session (Google users)
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId } = await req.json();

    if (!callId) {
      return Response.json({ error: "Missing callId" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        pandit: {
          select: { name: true, speciality: true },
        },
      },
    });

    if (!call) {
      return Response.json({ error: "Call not found" }, { status: 404 });
    }

    const uid = Math.floor(Math.random() * 100000);
    const token = generateAgoraToken(call.channelName, uid);

    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: "ONGOING",
        startTime: new Date(),
      },
    });

    return Response.json({
      callId: updatedCall.id,
      channelName: updatedCall.channelName,
      token,
      uid,
      appId: process.env.AGORA_APP_ID,
      pandit: call.pandit,
    });

  } catch (err) {
    console.error("❌ ACCEPT API ERROR:", err.message);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}


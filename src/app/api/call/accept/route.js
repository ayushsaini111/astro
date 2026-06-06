// api/call/accept/route.js
import { prisma } from "@/lib/prisma";
import { generateAgoraToken } from "@/lib/agora";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get("userId")?.value;

    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId } = await req.json();
    if (!callId) return Response.json({ error: "Missing callId" }, { status: 400 });

    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        pandit: { select: { name: true, speciality: true } },
      },
    });

    if (!call) return Response.json({ error: "Call not found" }, { status: 404 });

    // ✅ Get balance info to pass to AgoraCall
    const now = new Date();
    const freeUsage = await prisma.freeCallUsage.findUnique({ where: { userId } });
    const hasFreeCall = !freeUsage;

    const activePlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gte: now },
        remainingSeconds: { gt: 0 },
      },
      orderBy: { endDate: "asc" },
    });

    const uid = Math.floor(Math.random() * 100000);
    const token = generateAgoraToken(call.channelName, uid);

    await prisma.call.update({
      where: { id: callId },
      data: { status: "ONGOING", startTime: now },
    });

    return Response.json({
      callId: call.id,
      channelName: call.channelName,
      token,
      uid,
      appId: process.env.AGORA_APP_ID,
      pandit: call.pandit,
      isFreeCall: hasFreeCall,                          // ✅ added
      planSecondsLeft: activePlan?.remainingSeconds ?? 0, // ✅ added
    });

  } catch (err) {
    console.error("❌ ACCEPT API ERROR:", err.message);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

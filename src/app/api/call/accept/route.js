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

  const activePlans = await prisma.userPlan.findMany({
  where: {
    userId,
    isActive: true,
    endDate: { gte: now },
    remainingSeconds: { gt: 0 },
  },
});

const totalSeconds = activePlans.reduce(
  (sum, plan) => sum + plan.remainingSeconds,
  0
);
    const hasFreeCall = !freeUsage && activePlans.length === 0;

    const uid = Math.floor(Math.random() * 100000);
    const token = generateAgoraToken(call.channelName, uid);

    await prisma.call.update({
      where: { id: callId },
      data: { status: "ONGOING", startTime: now },
    });

const expiryTime = Date.now() + totalSeconds * 1000;

console.log("================================");
console.log("CALL ACCEPTED");
console.log("User:", userId);
console.log("Total Plan Seconds:", totalSeconds);
console.log("Has Free Call:", hasFreeCall);
console.log("Expiry Time:", new Date(expiryTime));
console.log("================================");

return Response.json({
  callId: call.id,
  channelName: call.channelName,
  token,
  uid,
  appId: process.env.AGORA_APP_ID,
  pandit: call.pandit,

  // important
  isFreeCall: hasFreeCall,
  planSecondsLeft: totalSeconds,
  expiryTime,
});

  } catch (err) {
    console.error("❌ ACCEPT API ERROR:", err.message);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
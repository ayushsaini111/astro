import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEvent } from "@/lib/sse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { messaging } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    let userId = req.headers.get("x-user-id");
    if (!userId) userId = (await cookies()).get("userId")?.value;
    if (!userId) userId = (await getServerSession(authOptions))?.user?.id;
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { callId, reason } = await req.json();
    if (!callId) return Response.json({ error: "Missing callId" }, { status: 400 });
    const why = reason === "BUSY" ? "BUSY" : "DECLINED";

    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { userId: true, panditId: true, status: true },
    });
    if (!call) return Response.json({ error: "Not found" }, { status: 404 });
    if (call.userId !== userId) {
      return Response.json({ error: "Unauthorized for this call" }, { status: 403 });
    }

    sendEvent(`user-${call.userId}`, "call-ended", { callId, status: "FAILED", reason: why });
    sendEvent(`pandit-${call.panditId}`, "call-ended", { callId, status: "FAILED", reason: why });

    const [pandit] = await Promise.all([
      prisma.pandit.findUnique({ where: { id: call.panditId }, select: { fcmToken: true } }),
      call.status !== "COMPLETED"
        ? prisma.call.update({ where: { id: callId }, data: { status: "FAILED" } })
        : null,
    ]);

    if (pandit?.fcmToken) {
      after(() =>
        messaging
          .send({
            token: pandit.fcmToken,
            data: { type: "call_ended", callId: String(callId), reason: why },
            android: { priority: "high", ttl: 30000 },
            apns: { payload: { aps: { contentAvailable: true } } },
          })
          .catch((e) => console.error("FCM call_ended to pandit failed:", e.message))
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("❌ Reject call error:", err.message);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
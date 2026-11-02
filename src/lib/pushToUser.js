import { messaging } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function pushToUser(userId, { type, title, body, data = {} }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      console.log(`⚠️ No FCM token for user ${userId} — skipping push`);
      return;
    }

    const stringData = Object.fromEntries(
      Object.entries({ type, ...data }).map(([k, v]) => [
        k,
        typeof v === "object" ? JSON.stringify(v) : String(v),
      ])
    );

    const isCallType = type === "incoming_call" || type === "call_ended" || type === "call_connected";

    const message = {
      token: user.fcmToken,
      data: stringData,
      android: isCallType
        ? { priority: "high", ttl: 30000 }
        : { priority: "high", notification: { channelId: "default", sound: "default" } },
      apns: {
        payload: { aps: isCallType ? { contentAvailable: true } : { sound: "default", contentAvailable: true } },
        headers: { "apns-priority": "10" },
      },
    };
    if (!isCallType && title) message.notification = { title, body };

    await messaging.send(message);
    console.log(`✅ push ${type} sent to user ${userId}`);
  } catch (err) {
    console.error("pushToUser failed:", err?.message);
  }
}
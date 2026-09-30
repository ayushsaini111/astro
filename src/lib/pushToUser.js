import { messaging } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function pushToUser(userId, { type, title, body, data = {} }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) return;

    const stringData = Object.fromEntries(
      Object.entries({ type, ...data }).map(([k, v]) => [
        k,
        typeof v === "object" ? JSON.stringify(v) : String(v),
      ])
    );

    await messaging.send({
      token: user.fcmToken,
      notification: title ? { title, body } : undefined,
      data: stringData,
      android: {
        priority: "high",
        notification: { channelId: "calls", sound: "default" },
      },
      apns: {
        payload: { aps: { sound: "default", "content-available": 1 } },
      },
    });
  } catch (err) {
    console.error("pushToUser failed:", err?.message);
  }
}
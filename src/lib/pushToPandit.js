// lib/pushToPandit.js
import { messaging } from "@/lib/firebaseAdmin";
import { prisma } from "@/lib/prisma";

export async function pushToPandit(panditId, { type, title, body, data = {} }) {
  try {
    const pandit = await prisma.pandit.findUnique({
      where: { id: panditId },
      select: { fcmToken: true },
    });

    if (!pandit?.fcmToken) {
      console.log(`⚠️ No FCM token for pandit ${panditId} — skipping push`);
      return;
    }

    const stringData = Object.fromEntries(
      Object.entries({ type, ...data }).map(([k, v]) => [
        k,
        typeof v === "object" ? JSON.stringify(v) : String(v),
      ])
    );

    await messaging.send({
      token: pandit.fcmToken,
      notification: title ? { title, body } : undefined,
      data: stringData,
      android: {
        priority: "high",
        notification: { channelId: "default", sound: "default" },
      },
      apns: {
        payload: { aps: { sound: "default", "content-available": 1 } },
      },
    });
  } catch (err) {
    console.error("pushToPandit failed:", err?.message);
  }
}
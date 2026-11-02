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

    // only these are silent; everything else (incl. incoming_call) is a visible notification
    const silent = type === "call_ended" || type === "call_connected";

    const message = {
      token: pandit.fcmToken,
      data: stringData,
      android: silent
        ? { priority: "high", ttl: 30000 }
        : {
            priority: "high",
            ttl: 30000,
            notification: { channelId: "default", sound: "default", priority: "max", defaultVibrateTimings: true },
          },
      apns: {
        payload: { aps: silent ? { contentAvailable: true } : { sound: "default", contentAvailable: true } },
        headers: { "apns-priority": "10" },
      },
    };
    if (!silent && title) message.notification = { title, body };

    await messaging.send(message);
    console.log(`✅ push ${type} sent to pandit ${panditId}`);
  } catch (err) {
    console.error("pushToPandit failed:", err?.message, err?.code);
  }
}
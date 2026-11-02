import { prisma } from "@/lib/prisma";
import { messaging } from "@/lib/firebaseAdmin";

export async function sendNotification({ userId, type, title, body, data = {} }) {
  if (!userId) return null;

  const notification = await prisma.notification.create({
    data: { userId, type, title, body, data },
  });

  let pushed = false;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (!user?.fcmToken) {
      console.log(`⚠️ No FCM token for user ${userId} — in-app only`);
    } else {
      const id = await messaging.send({
        token: user.fcmToken,
        notification: { title, body },
        data: {
          type,
          title,
          body,
          notificationId: notification.id,
          ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        },
        android: {
          priority: "high",
          notification: { channelId: "default", sound: "default" },
        },
      });
      pushed = true;
      console.log(`✅ push ${type} → user ${userId} …${user.fcmToken.slice(-8)} id=${id}`);
    }
  } catch (err) {
    console.error("⚠️ Push send failed:", err.code, err.message);
  }

  return { ...notification, pushed };
}

export async function sendBulkNotification({ userIds, type, title, body, data = {} }) {
  if (!userIds?.length) return null;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, title, body, data })),
  });

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, fcmToken: { not: null } },
    select: { fcmToken: true },
  });
  const tokens = users.map((u) => u.fcmToken).filter(Boolean);
  if (tokens.length === 0) return { sentTo: userIds.length, pushedTo: 0 };

  // FCM multicast caps at 500 tokens per call
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));

  await Promise.allSettled(
    chunks.map((chunk) =>
      messaging.sendEachForMulticast({
        tokens: chunk,
        // ✅ data-only here too — title/body must be inside data for the RN client to read them
        data: { type, title, body },
        android: { priority: "high" },
      })
    )
  );

  return { sentTo: userIds.length, pushedTo: tokens.length };
}
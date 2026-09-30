import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fcmToken } = await req.json();

    if (!fcmToken) {
      return Response.json({ error: "Missing fcmToken" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Save user FCM token error:", err.message);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
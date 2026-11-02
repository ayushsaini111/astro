import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkNotification } from "@/lib/notifications/send";
import { getSegmentUserIds } from "@/lib/notifications/segments";

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, text, target, userId, segment } = body; // target: "ALL" | "USER" | "SEGMENT"

    if (!title || !text) {
      return NextResponse.json({ success: false, error: "Title and text required" }, { status: 400 });
    }

    let userIds;
    let notifType = "OFFER";

    if (target === "USER") {
      if (!userId) return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
      userIds = [userId];
      notifType = "CUSTOM";
    } else if (target === "SEGMENT") {
      if (!segment) return NextResponse.json({ success: false, error: "segment required" }, { status: 400 });
      userIds = await getSegmentUserIds(segment);
      notifType = "OFFER";
    } else {
      const users = await prisma.user.findMany({ where: { isBlocked: false }, select: { id: true } });
      userIds = users.map((u) => u.id);
    }

    const result = await sendBulkNotification({ userIds, type: notifType, title, body: text });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("❌ Admin broadcast error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
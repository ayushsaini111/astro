// backend/src/app/api/call/heartbeat/route.js

import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return Response.json({ error: "Missing callId" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { id: true, status: true, startTime: true },
    });

    if (!call) {
      return Response.json({ error: "Call not found" }, { status: 404 });
    }

    // If call ended, return 410 Gone
    if (call.status === "COMPLETED" || call.status === "FAILED") {
      return Response.json(
        { status: "ended", message: "Call has ended" },
        { status: 410 }
      );
    }

    // Return current duration
    const duration = call.startTime
      ? Math.floor((Date.now() - new Date(call.startTime).getTime()) / 1000)
      : 0;

    return Response.json({
      status: call.status,
      duration,
      callId: call.id,
    });
  } catch (err) {
    console.error("❌ Heartbeat error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
// backend/src/app/api/call/mark-ongoing/route.js

import { prisma } from "@/lib/prisma";
import { sendEvent } from "@/lib/sse";

export async function POST(req) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return Response.json({ error: "Missing callId" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { id: true, status: true, startTime: true, userId: true, panditId: true },
    });

    if (!call) {
      return Response.json({ error: "Call not found" }, { status: 404 });
    }

    // Only update if not already ONGOING
    if (call.status !== "ONGOING") {
      const now = new Date();

      await prisma.call.update({
        where: { id: callId },
        data: {
          status: "ONGOING",
          startTime: call.startTime || now, // Keep existing startTime if set
        },
      });

      console.log("✅ Call marked as ONGOING:", callId);

      // Notify both sides
      if (call.userId) {
        sendEvent(`user-${call.userId}`, "call-ongoing", { callId });
      }
      if (call.panditId) {
        sendEvent(`pandit-${call.panditId}`, "call-ongoing", { callId });
      }
    }

    return Response.json({ message: "Call ongoing", callId });
  } catch (err) {
    console.error("❌ Mark ongoing error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
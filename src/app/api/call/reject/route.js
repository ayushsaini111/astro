import { prisma } from "@/lib/prisma";
import { sendEvent } from "@/lib/sse";

export async function POST(req) {
  const { callId } = await req.json();
  if (!callId) return Response.json({ error: "Missing callId" }, { status: 400 });

  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { userId: true, panditId: true, status: true },
  });

  if (!call) return Response.json({ error: "Not found" }, { status: 404 });

  // Only update if not already completed
  if (call.status !== "COMPLETED") {
    await prisma.call.update({
      where: { id: callId },
      data: { status: "FAILED" },
    });
  }

  // ✅ Notify both sides so UI clears immediately
  sendEvent(`user-${call.userId}`, "call-ended", { callId, status: "FAILED" });
  sendEvent(`pandit-${call.panditId}`, "call-ended", { callId, status: "FAILED" });

  return Response.json({ success: true });
}
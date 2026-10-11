import { prisma } from "@/lib/prisma";
import { sendEvent } from "@/lib/sse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    // ✅ ADDED — auth check (was completely missing before)
    let userId = req.headers.get("x-user-id");
    if (!userId) {
      const cookieStore = await cookies();
      userId = cookieStore.get("userId")?.value;
    }
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId } = await req.json();
    if (!callId) return Response.json({ error: "Missing callId" }, { status: 400 });

    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { userId: true, panditId: true, status: true },
    });

    if (!call) return Response.json({ error: "Not found" }, { status: 404 });

    // ✅ ADDED — only the user on this call can reject it via this route
    if (call.userId !== userId) {
      return Response.json({ error: "Unauthorized for this call" }, { status: 403 });
    }

    if (call.status !== "COMPLETED") {
      await prisma.call.update({
        where: { id: callId },
        data: { status: "FAILED" },
      });
    }

    sendEvent(`user-${call.userId}`, "call-ended", { callId, status: "FAILED" });
    sendEvent(`pandit-${call.panditId}`, "call-ended", { callId, status: "FAILED" });

    return Response.json({ success: true });
  } catch (err) {
    console.error("❌ Reject call error:", err.message);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEvent } from "@/lib/sse";
import { pushToUser } from "@/lib/pushToUser";

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    let payload;
    try {
      payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const pandit = await prisma.pandit.findUnique({ where: { id: payload.id } });
    if (!pandit) return NextResponse.json({ error: "Pandit not found" }, { status: 404 });

    const { callId } = await req.json();
    if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });

    const call = await prisma.call.findUnique({
      where: { id: callId },
      select: { id: true, panditId: true, userId: true, status: true },
    });

    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    if (call.panditId !== pandit.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    sendEvent(`user-${call.userId}`, "call-ended", { callId, status: "FAILED" });
    sendEvent(`pandit-${call.panditId}`, "call-ended", { callId, status: "FAILED" });

    // Await only the DB update — fast, local, and needed before responding.
    if (call.status !== "COMPLETED") {
      await prisma.call.update({ where: { id: call.id }, data: { status: "FAILED" } });
    }

    // Fire-and-forget — don't block the HTTP response on an external push call.
    if (call.userId) {
      pushToUser(call.userId, { type: "call_ended", data: { callId: String(callId) } })
        .catch((e) => console.error("pushToUser failed:", e.message));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mobile reject call error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
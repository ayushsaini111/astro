import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { endCallAndBill } from "@/lib/callBilling";

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = auth.replace("Bearer ", "");
    let payload;
    try { payload = jwt.verify(token, process.env.NEXTAUTH_SECRET); }
    catch { return NextResponse.json({ error: "Invalid token" }, { status: 401 }); }

    const pandit = await prisma.pandit.findUnique({ where: { id: payload.id } });
    if (!pandit) return NextResponse.json({ error: "Pandit not found" }, { status: 404 });

    const { callId, clientDuration } = await req.json();
    if (!callId) return NextResponse.json({ error: "Missing callId" }, { status: 400 });

    const result = await endCallAndBill({ callId, endedBy: pandit.id, clientDuration });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Mobile End Call Error", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getPusher } from "@/lib/sse";

export const runtime = "nodejs";

export async function POST(req) {
  const pusher = getPusher();
  if (!pusher) return NextResponse.json({ error: "Realtime not configured" }, { status: 503 });

  const form = await req.formData();
  const socketId = form.get("socket_id");
  const channel = form.get("channel_name");
  if (!socketId || !channel) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (channel.startsWith("private-pandit-")) {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let payload;
    try {
      payload = jwt.verify(auth.replace("Bearer ", ""), process.env.NEXTAUTH_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    if (channel !== `private-pandit-${payload.id}`) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (channel.startsWith("private-user-")) {
    // The user app has no JWT today (it sends x-user-id like every other call),
    // so this is only as strong as the rest of the user API.
    const uid = req.headers.get("x-user-id");
    if (!uid || channel !== `private-user-${uid}`) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(pusher.authorizeChannel(String(socketId), String(channel)));
}
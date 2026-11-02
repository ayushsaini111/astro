// backend/src/app/api/events/route.js
import { addClient, removeClient } from "@/lib/sse";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const panditId = searchParams.get("panditId");
  const userIdParam = searchParams.get("userId");

  let clientId = null;

  if (panditId) {
    clientId = `pandit-${panditId}`;
  } else if (userIdParam) {
    clientId = `user-${userIdParam}`;
  } else {
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get("userId")?.value;

    if (cookieUserId) {
      clientId = `user-${cookieUserId}`;
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) clientId = `user-${session.user.id}`;
    }
  }

  if (!clientId) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(`SSE client connected: ${clientId}`);

  const encoder = new TextEncoder();
  let controller;
  let keepAlive;
  let closed = false;

  const cleanup = (why) => {
    if (closed) return;
    closed = true;
    clearInterval(keepAlive);
    removeClient(clientId, controller);
    console.log(`SSE client ${why}: ${clientId}`);
  };

  const stream = new ReadableStream({
    start(c) {
      controller = {
        enqueue: (data) => c.enqueue(encoder.encode(data)),
        close: () => c.close(),
      };
      addClient(clientId, controller);

      // Tell the client it is live right away
      controller.enqueue(`event: ping\ndata: 1\n\n`);

      // Named event so the app can detect dead connections (every 20s)
      keepAlive = setInterval(() => {
        try {
          controller.enqueue(`event: ping\ndata: 1\n\n`);
        } catch {
          cleanup("dropped");
        }
      }, 20000);
    },
    cancel() {
      cleanup("disconnected");
    },
  });

  req.signal.addEventListener("abort", () => cleanup("aborted"));

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
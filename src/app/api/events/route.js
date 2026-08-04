// backend/src/app/api/events/route.js
import { addClient, removeClient } from "@/lib/sse";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  // ─── Resolve clientId ────────────────────────────────────────────────────────
  // EventSource cannot send custom headers — identity must come from the URL.
  // Priority: query param → cookie → session (cookie/session only work when
  // frontend and backend share the same origin/port).

  const panditId = searchParams.get("panditId");
  const userIdParam = searchParams.get("userId");

  let clientId = null;

  if (panditId) {
    // Pandit app connecting
    clientId = `pandit-${panditId}`;

  } else if (userIdParam) {
    // ✅ User connecting via query param — this is the only reliable method
    // because EventSource cannot send Authorization or x-user-id headers.
    clientId = `user-${userIdParam}`;

  } else {
    // Last-resort fallbacks for same-origin setups
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get("userId")?.value;

    if (cookieUserId) {
      clientId = `user-${cookieUserId}`;
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        clientId = `user-${session.user.id}`;
      }
    }
  }

  if (!clientId) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(`📡 SSE client connected: ${clientId}`);

  // ─── Stream setup ─────────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = {
        enqueue: (data) => c.enqueue(encoder.encode(data)),
        close: () => c.close(),
      };
      addClient(clientId, controller);

      // Initial ping so the browser knows the connection is alive
      controller.enqueue(`: ping\n\n`);
    },
    cancel() {
      console.log(`🔌 SSE client disconnected: ${clientId}`);
      removeClient(clientId, controller);
    },
  });

  // Keep-alive ping every 25 s (prevents proxies from closing idle connections)
  const keepAlive = setInterval(() => {
    try {
      controller.enqueue(`: ping\n\n`);
    } catch {
      clearInterval(keepAlive);
      removeClient(clientId, controller);
    }
  }, 25000);

  req.signal.addEventListener("abort", () => {
    clearInterval(keepAlive);
    removeClient(clientId, controller);
    console.log(`🔌 SSE client aborted: ${clientId}`);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
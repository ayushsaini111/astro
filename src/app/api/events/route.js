import { addClient, removeClient } from "@/lib/sse";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }

  // Also support panditId via query param
  const { searchParams } = new URL(req.url);
  const panditId = searchParams.get("panditId");
  const clientId = panditId ? `pandit-${panditId}` : userId ? `user-${userId}` : null;

  if (!clientId) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let controller;

  const stream = new ReadableStream({
    start(c) {
      controller = {
        enqueue: (data) => c.enqueue(encoder.encode(data)),
        close: () => c.close(),
      };
      addClient(clientId, controller);

      // Send initial ping
      controller.enqueue(`: ping\n\n`);
    },
    cancel() {
      removeClient(clientId, controller);
    },
  });

  // Keep alive every 25s
  const keepAlive = setInterval(() => {
    try { controller.enqueue(`: ping\n\n`); }
    catch { clearInterval(keepAlive); removeClient(clientId, controller); }
  }, 25000);

  req.signal.addEventListener("abort", () => {
    clearInterval(keepAlive);
    removeClient(clientId, controller);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
import { prisma } from "@/lib/prisma";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Meta's one-time verification handshake
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return new Response(challenge, { status: 200 });
  }

  console.error("❌ Webhook verification failed");
  return new Response("Forbidden", { status: 403 });
}

// Incoming messages from Meta
export async function POST(request) {
  try {
    const body = await request.json();
    console.log("📩 Webhook payload:", JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      // Could be a status update (delivered/read), not a message — ignore safely
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    for (const msg of messages) {
      const fromNumber = msg.from; // e.g. "919876543210"
      const messageText =
        msg.text?.body || msg.button?.text || "[Non-text message]";
      const waMessageId = msg.id;

      // Try to match this number to an existing booking (last 10 digits)
      const last10 = fromNumber.slice(-10);
      const matchedBooking = await prisma.booking.findFirst({
        where: { customerPhone: last10 },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      await prisma.whatsAppMessage.upsert({
        where: { waMessageId },
        update: {}, // already stored, skip duplicate
        create: {
          fromNumber,
          messageText,
          waMessageId,
          bookingId: matchedBooking?.id || null,
        },
      });

      console.log("✅ Saved reply from:", fromNumber);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("💥 Webhook error:", error);
    // Always return 200 to Meta even on internal error, or Meta will retry aggressively
    return new Response(JSON.stringify({ success: false }), { status: 200 });
  }
}
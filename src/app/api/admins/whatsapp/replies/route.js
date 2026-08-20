import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    const messages = await prisma.whatsAppMessage.findMany({
      where: bookingId ? { bookingId } : {},
      orderBy: { receivedAt: "desc" },
      take: 200,
    });

    return new Response(
      JSON.stringify({ success: true, data: messages, count: messages.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Get replies error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
import { prisma } from "@/lib/prisma";
import { sendCompletionCertificate } from "@/services/whatsapp";  // ✅ ADD THIS

export async function POST(request) {
  console.log("🔥 Update booking status endpoint hit!");

  try {
    const body = await request.json();
    const { bookingId, status, videoLink, certificateUrl } = body;

    console.log("🔄 Updating booking:", { bookingId, status });

    if (!bookingId || !status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing bookingId or status",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Booking not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const validStatuses = ["CONFIRMED", "FEEDBACK", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        ...(status === "COMPLETED" && {
          completedAt: new Date(),
          ...(videoLink && { videoLink }),
          ...(certificateUrl && { certificateUrl }),
        }),
        ...(status === "CANCELLED" && {
          cancelledAt: new Date(),
        }),
      },
      include: {
        reminders: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log("✅ Booking updated:", updatedBooking.id);

    // ✅ Send WhatsApp with certificate if status is COMPLETED
   if (status === "COMPLETED" && certificateUrl) {
  const result = await sendCompletionCertificate(updatedBooking, certificateUrl, videoLink);
  if (result.success) {
    console.log("✅ Certificate message sent via WhatsApp");
  } else {
    console.error("⚠️ Failed to send WhatsApp certificate:", result.error);
  }
}

    return new Response(
      JSON.stringify({
        success: true,
        booking: updatedBooking,
        message: "Booking status updated",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("💥 Update booking error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
import { prisma } from "@/lib/prisma";
import {
  sendBookingConfirmation,
} from "@/services/whatsapp";
import { createReminders } from "@/services/reminders";

export async function POST(request) {
  console.log("🔥 Create booking endpoint hit!");

  try {
    const body = await request.json();
    // ... existing validation ...

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        // ... existing data ...
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
      include: {
        reminders: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // ✅ Send booking confirmation immediately
    try {
      await sendBookingConfirmation(booking);
    } catch (e) {
      console.error("⚠️ Failed to send WhatsApp confirmation:", e.message);
    }

    // ✅ Create scheduled reminders
    try {
      await createReminders(booking.id, booking.scheduledDate, booking.scheduledTime);
    } catch (e) {
      console.error("⚠️ Failed to create reminders:", e.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking,
        message: "Booking created and confirmation sent",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Create booking error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
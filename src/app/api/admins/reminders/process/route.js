import { prisma } from "@/lib/prisma";
import {
  sendBookingConfirmation,
  sendDayBeforeReminder,
  sendMorningReminder,
  sendOneHourBefore,
} from "@/services/whatsapp";

const REMINDER_SENDERS = {
  ONE_DAY_BEFORE: sendDayBeforeReminder,
  MORNING_OF_POOJA: sendMorningReminder,
};

export async function GET(request) {
  // ✅ Vercel sends "Authorization: Bearer <CRON_SECRET>" automatically
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.error("❌ Unauthorized cron attempt");
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  console.log("⏰ Processing due reminders...");

  try {
    const now = new Date();

    const dueReminders = await prisma.reminder.findMany({
      where: {
        sent: false,
        scheduledTime: { lte: now },
      },
      include: { booking: true },
      orderBy: { scheduledTime: "asc" },
      take: 50,
    });

    const eligible = dueReminders.filter(
      (r) => r.retryCount < r.maxRetries && r.booking
    );

    console.log(`📋 Found ${eligible.length} reminders to send`);

    const results = await Promise.allSettled(
      eligible.map(async (reminder) => {
        const sender = REMINDER_SENDERS[reminder.reminderType];

        if (!sender) {
          throw new Error(`No sender for type: ${reminder.reminderType}`);
        }

        // Skip cancelled bookings
        if (reminder.booking.status === "CANCELLED") {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              sent: true,
              sentAt: new Date(),
              errorMessage: "Skipped — booking cancelled",
            },
          });
          return { id: reminder.id, skipped: true };
        }

        const result = await sender(reminder.booking);

        if (result.success) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { sent: true, sentAt: new Date(), errorMessage: null },
          });
          return { id: reminder.id, sent: true };
        } else {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              retryCount: { increment: 1 },
              errorMessage: result.error,
            },
          });
          throw new Error(result.error);
        }
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✅ Sent: ${sent}, ❌ Failed: ${failed}`);

    return Response.json({
      success: true,
      processed: eligible.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("💥 Reminder processor error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
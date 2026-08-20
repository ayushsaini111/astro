import { prisma } from "@/lib/prisma";

const IST_OFFSET = 5.5 * 60 * 60 * 1000; // 5hr 30min in ms

function toUTCDate(dateStr, timeStr) {
  // dateStr = "YYYY-MM-DD", timeStr = "HH:mm"
  const istDate = new Date(`${dateStr}T${timeStr || "10:00"}:00`);
  // istDate is interpreted as IST, but JS treats it as local server time (probably UTC).
  // We need to offset by 5.5 hours to get the actual UTC instant.
  return new Date(istDate.getTime() - IST_OFFSET);
}

function calculateReminderTimes(scheduledDate, scheduledTime) {
  const now = new Date();
  const reminders = [];

  const safeTime = !scheduledTime || scheduledTime === "00:00" ? "10:00" : scheduledTime;

  // Booking date/time as UTC
  const bookingDateTime = toUTCDate(scheduledDate, safeTime);

  // ONE_DAY_BEFORE — 8 AM IST, the day before
  const oneDayBeforeIST = new Date(bookingDateTime.getTime() + IST_OFFSET); // back to IST for manipulation
  oneDayBeforeIST.setDate(oneDayBeforeIST.getDate() - 1);
  oneDayBeforeIST.setHours(8, 0, 0, 0);
  const oneDayBeforeUTC = new Date(oneDayBeforeIST.getTime() - IST_OFFSET);

  if (oneDayBeforeUTC > now) {
    reminders.push({ type: "ONE_DAY_BEFORE", time: oneDayBeforeUTC });
  }

  // MORNING_OF_POOJA — 7 AM IST, same day
  const morningIST = new Date(bookingDateTime.getTime() + IST_OFFSET);
  morningIST.setHours(7, 0, 0, 0);
  const morningUTC = new Date(morningIST.getTime() - IST_OFFSET);

  if (morningUTC > now) {
    reminders.push({ type: "MORNING_OF_POOJA", time: morningUTC });
  }

  return reminders;
}
export async function POST(request) {
  console.log("🔥 Create reminders endpoint hit!");

  try {
    const body = await request.json();
    const { bookingId } = body;

    console.log("📲 Creating reminders for booking:", bookingId);

    if (!bookingId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing bookingId",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Booking not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Calculate reminder times
    const reminderTimes = calculateReminderTimes(
      booking.scheduledDate,
      booking.scheduledTime
    );

    console.log("📅 Calculated reminders:", reminderTimes.length);

    // Create reminders in database
    const createdReminders = await Promise.all(
      reminderTimes.map((reminder) =>
        prisma.reminder.upsert({
          where: {
            bookingId_reminderType: {
              bookingId: bookingId,
              reminderType: reminder.type,
            },
          },
          update: {
            scheduledTime: reminder.time,
            sent: false,
          },
          create: {
            bookingId,
            reminderType: reminder.type,
            scheduledTime: reminder.time,
            sent: false,
            sentVia: "WHATSAPP",
          },
        })
      )
    );

    // Update booking flag
    await prisma.booking.update({
      where: { id: bookingId },
      data: { remindersScheduled: true },
    });

    console.log("✅ Reminders created:", createdReminders.length);

    return new Response(
      JSON.stringify({
        success: true,
        reminders: createdReminders,
        message: `${createdReminders.length} reminders scheduled`,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Create reminders error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
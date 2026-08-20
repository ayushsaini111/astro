// src/services/reminders.js
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
export async function createReminders(bookingId, scheduledDate, scheduledTime) {
  console.log(
    "📲 Creating reminders for:",
    bookingId,
    scheduledDate,
    scheduledTime
  );

  try {
    const reminderTimes = calculateReminderTimes(scheduledDate, scheduledTime);

    console.log(`📋 ${reminderTimes.length} reminders to create`);

    // ✅ Create all reminders (at least CONFIRMATION will always exist)
    const created = await Promise.all(
      reminderTimes.map((reminder) =>
        prisma.reminder.upsert({
          where: {
            bookingId_reminderType: {
              bookingId,
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

    // ✅ Mark remindersScheduled = true on the booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: { remindersScheduled: true },
    });

    console.log(`✅ ${created.length} reminders created, booking flagged`);
    return created;
  } catch (error) {
    console.error("💥 createReminders failed:", error);
    throw error; // Re-throw so the caller sees the real error
  }
}
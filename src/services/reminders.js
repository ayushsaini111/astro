import { prisma } from "@/lib/prisma";

const HOUR = 60 * 60 * 1000;

function calculateReminderTimes(scheduledDate) {
  const now = new Date();
  // midnight IST of the pooja date. India has no DST, so fixed offset math is safe.
  const dayStart = new Date(`${scheduledDate}T00:00:00+05:30`);
  if (isNaN(dayStart)) return [];

  const candidates = [
    { type: "ONE_DAY_BEFORE", time: new Date(dayStart.getTime() - 24 * HOUR + 8 * HOUR) }, // 8 AM IST, day before
    { type: "MORNING_OF_POOJA", time: new Date(dayStart.getTime() + 7 * HOUR) },            // 7 AM IST, same day
  ];

  return candidates.filter((r) => r.time > now);
}

export async function createReminders(bookingId, scheduledDate) {
  const times = calculateReminderTimes(scheduledDate);

  await prisma.$transaction([
    ...times.map((r) =>
      prisma.reminder.upsert({
        where: { bookingId_reminderType: { bookingId, reminderType: r.type } },
        update: { scheduledTime: r.time, sent: false, retryCount: 0, errorMessage: null },
        create: { bookingId, reminderType: r.type, scheduledTime: r.time, sentVia: "WHATSAPP" },
      })
    ),
    prisma.booking.update({ where: { id: bookingId }, data: { remindersScheduled: true } }),
  ]);

  console.log(`✅ ${times.length} reminders created for booking ${bookingId}`);
  return times;
}
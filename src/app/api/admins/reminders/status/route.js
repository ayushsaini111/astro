// app/backend/admins/reminders/status/route.js
import { prisma } from "@/lib/prisma";

const bookingSelect = {
  select: {
    customerName: true,
    poojaTitle: true,
    scheduledDate: true,
    scheduledTime: true,
    status: true,
  },
};

export async function GET() {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const [pending, sent, failed, overdue, nextDue, lastSent, recentErrors, byType] =
    await Promise.all([
      prisma.reminder.count({ where: { sent: false, retryCount: { lt: 3 } } }),
      prisma.reminder.count({ where: { sent: true } }),
      prisma.reminder.count({ where: { sent: false, retryCount: { gte: 3 } } }),
      prisma.reminder.count({
        where: { sent: false, retryCount: { lt: 3 }, scheduledTime: { lt: twoHoursAgo } },
      }),
      prisma.reminder.findFirst({
        where: { sent: false, retryCount: { lt: 3 } },
        orderBy: { scheduledTime: "asc" },
        select: {
          id: true,
          reminderType: true,
          scheduledTime: true,
          booking: bookingSelect,
        },
      }),
      prisma.reminder.findFirst({
        where: { sent: true, sentAt: { not: null } },
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          reminderType: true,
          sentAt: true,
          sentVia: true,
          booking: bookingSelect,
        },
      }),
      prisma.reminder.findMany({
        where: { errorMessage: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: {
          id: true,
          reminderType: true,
          retryCount: true,
          errorMessage: true,
          updatedAt: true,
          booking: bookingSelect,
        },
      }),
      prisma.reminder.groupBy({
        by: ["reminderType", "sent"],
        _count: { _all: true },
      }),
    ]);

  return Response.json({
    pending,
    sent,
    failed,
    overdue,
    nextDue,
    lastSent,
    recentErrors,
    byType,
    cronLooksHealthy: overdue === 0,
  });
}
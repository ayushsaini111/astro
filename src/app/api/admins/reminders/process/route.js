import { prisma } from "@/lib/prisma";
import { sendDayBeforeReminder, sendMorningReminder } from "@/services/whatsapp";
import { sendNotification } from "@/lib/notifications/send";

function to12h(t) {
  if (!t) return "the scheduled time";
  const [h, m = "00"] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

const CONFIG = {
  ONE_DAY_BEFORE: {
    whatsapp: sendDayBeforeReminder,
    title: "🙏 Pooja Tomorrow",
    body: (b) => `Your "${b.poojaTitle}" is scheduled tomorrow at ${to12h(b.scheduledTime)}.`,
  },
  MORNING_OF_POOJA: {
    whatsapp: sendMorningReminder,
    title: "🙏 Pooja Today",
    body: (b) => `Your "${b.poojaTitle}" is today at ${to12h(b.scheduledTime)}. Please be ready.`,
  },
};

async function processOne(r) {
  const cfg = CONFIG[r.reminderType];
  const b = r.booking;

  if (!cfg || !b || b.status === "CANCELLED") {
    await prisma.reminder.update({
      where: { id: r.id },
      data: { sent: true, sentAt: new Date(), errorMessage: !cfg ? "No sender for type" : "Skipped: booking cancelled" },
    });
    return "skipped";
  }

  // claim first: if another run already took it, count is 0 and we stop
  const claim = await prisma.reminder.updateMany({
    where: { id: r.id, sent: false },
    data: { sent: true, sentAt: new Date() },
  });
  if (claim.count === 0) return "already-claimed";

  const hasUser = b.userId && b.userId !== "guest";

  // WhatsApp and in-app + push run in parallel
  const [wa, app] = await Promise.allSettled([
    cfg.whatsapp(b),
    hasUser
      ? sendNotification({
          userId: b.userId,
          type: "REMINDER",
          title: cfg.title,
          body: cfg.body(b),
          data: { bookingId: b.bookingId || b.id, reminderType: r.reminderType },
        })
      : Promise.resolve(null),
  ]);

  const waOk = wa.status === "fulfilled" && wa.value?.success === true;
  const appOk = app.status === "fulfilled" && !!app.value;
  const channels = [waOk && "WHATSAPP", appOk && "APP_PUSH"].filter(Boolean);

  if (channels.length) {
    await prisma.reminder.update({
      where: { id: r.id },
      data: {
        sentVia: channels.join("+"),
        errorMessage: waOk ? null : `WhatsApp: ${wa.value?.error || wa.reason?.message || "failed"}`,
      },
    });
    return channels.join("+");
  }

  // everything failed: release the claim and count a retry
  await prisma.reminder.update({
    where: { id: r.id },
    data: {
      sent: false,
      sentAt: null,
      retryCount: { increment: 1 },
      errorMessage: wa.value?.error || wa.reason?.message || app.reason?.message || "All channels failed",
    },
  });
  return "failed";
}

export async function GET(request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const due = await prisma.reminder.findMany({
      where: { sent: false, scheduledTime: { lte: new Date() }, retryCount: { lt: 3 } },
      include: { booking: true },
      orderBy: { scheduledTime: "asc" },
      take: 50,
    });

    const results = await Promise.allSettled(due.map(processOne));
    const summary = due.map((r, i) => ({
      id: r.id,
      type: r.reminderType,
      result: results[i].status === "fulfilled" ? results[i].value : `error: ${results[i].reason?.message}`,
    }));

    console.log("⏰ Reminders processed:", JSON.stringify(summary));
    return Response.json({ success: true, processed: due.length, results: summary });
  } catch (e) {
    console.error("💥 Reminder processor error:", e);
    return Response.json({ success: false, error: e.message }, { status: 500 });
  }
}
import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import {
  sendBookingConfirmation,
  sendDayBeforeReminder,
  sendMorningReminder,
  sendOneHourBefore,
  sendFeedbackRequest,
  sendCompletionCertificate,
} from "./whatsapp";

let cronJob = null;

/**
 * Start cron job to send reminders
 */
export function startReminderCron() {
  if (cronJob) {
    console.log("⏰ Cron job already running");
    return;
  }

  console.log("⏰ Starting reminder cron job...");

  // Run every minute
  cronJob = cron.schedule("* * * * *", async () => {
    try {
      console.log("🔄 Cron job running at:", new Date().toISOString());

      // Find unsent reminders that are due
      const dueReminders = await prisma.reminder.findMany({
        where: {
          sent: false,
          scheduledTime: {
            lte: new Date(), // Time is now or in past
          },
          retryCount: {
            lt: 3, // Less than max retries
          },
        },
        include: {
          booking: true,
        },
        take: 10, // Process max 10 at a time
      });

      console.log(`📬 Found ${dueReminders.length} due reminders`);

      for (const reminder of dueReminders) {
        try {
          console.log(
            `📱 Processing reminder: ${reminder.id} (${reminder.reminderType})`
          );

          let result;

          switch (reminder.reminderType) {
            case "CONFIRMATION":
              result = await sendBookingConfirmation(reminder.booking);
              break;
            case "ONE_DAY_BEFORE":
              result = await sendDayBeforeReminder(reminder.booking);
              break;
            case "MORNING_OF_POOJA":
              result = await sendMorningReminder(reminder.booking);
              break;
            case "ONE_HOUR_BEFORE":
              result = await sendOneHourBefore(reminder.booking);
              break;
            default:
              console.log("⚠️ Unknown reminder type:", reminder.reminderType);
              continue;
          }

          if (result.success) {
            // Mark as sent
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                sent: true,
                sentAt: new Date(),
                retryCount: 0,
              },
            });

            console.log("✅ Reminder sent:", reminder.id);
          } else {
            // Increment retry count
            await prisma.reminder.update({
              where: { id: reminder.id },
              data: {
                errorMessage: result.error,
                retryCount: reminder.retryCount + 1,
              },
            });

            console.error("❌ Reminder failed (retry):", reminder.id, result.error);
          }
        } catch (error) {
          console.error("💥 Error processing reminder:", error);
        }
      }
    } catch (error) {
      console.error("💥 Cron job error:", error);
    }
  });

  console.log("✅ Cron job started!");
}

/**
 * Stop cron job
 */
export function stopReminderCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log("⏹️ Cron job stopped");
  }
}
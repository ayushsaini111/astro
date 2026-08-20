const GRAPH_API_VERSION = "v25.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
  throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
}

const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
function formatTo12Hour(time24) {
  if (!time24) return "TBD";

  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12; // midnight/noon edge case

  return `${hour}:${minute} ${period}`;
}
// Message templates (must exist & be APPROVED in Meta Business, using NAMED variables e.g. {{customer_name}})
const TEMPLATES = {
  BOOKING_CONFIRMATION: "booking_confirmation_v1",
  DAY_BEFORE_REMINDER: "day_before_reminder_v1",
  MORNING_REMINDER: "morning_reminder_v1",
  ONE_HOUR_BEFORE: "pooja_reminder_1hr",
  FEEDBACK_REQUEST: "feedback_request_v1",
  COMPLETION_CERTIFICATE: "completion_certificate_v1", // offline — cert only
  COMPLETION_ONLINE: "completion_online_v1",            // online — cert + video
};

/**
 * Core sender — ALL callers must pass parameters as [{ name, value }, ...]
 * This matches Meta's "named parameters" template format.
 */
export async function sendWhatsAppMessage(phoneNumber, templateName, parameters = []) {
  console.log("📱 Sending WhatsApp message...", { phoneNumber, templateName });

  try {
    if (!phoneNumber || phoneNumber.replace(/\D/g, "").length < 10) {
      throw new Error("Invalid phone number format");
    }

    if (!TEMPLATES[templateName]) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    const cleanPhone = phoneNumber.replace(/[\s\-+]/g, "");
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Validate every param has name + value (catches silent bugs early)
    const invalidParam = parameters.find((p) => !p?.name || p?.value === undefined || p?.value === null);
    if (invalidParam) {
      throw new Error(
        `Invalid WhatsApp parameter — every item must be { name, value }. Got: ${JSON.stringify(invalidParam)}`
      );
    }

    const payload = {
      messaging_product: "whatsapp",
      to: finalPhone,
      type: "template",
      template: {
        name: TEMPLATES[templateName],
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: parameters.map((param) => ({
              type: "text",
              parameter_name: param.name,
              text: String(param.value),
            })),
          },
        ],
      },
    };

    const response = await fetch(GRAPH_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || "Unknown error";
      console.error("❌ WhatsApp API error:", errorMessage);
      throw new Error(`WhatsApp API error: ${errorMessage}`);
    }

    console.log("✅ Message sent:", data.messages?.[0]?.id);
    return { success: true, messageId: data.messages?.[0]?.id, data };
  } catch (error) {
    console.error("💥 WhatsApp send error:", error.message);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// All senders now consistently use [{ name, value }] format
// ============================================================================

export async function sendBookingConfirmation(booking) {
  return sendWhatsAppMessage(booking.customerPhone, "BOOKING_CONFIRMATION", [
    { name: "customer_name", value: booking.customerName },
    { name: "pooja_title", value: booking.poojaTitle },
    { name: "scheduled_date", value: booking.scheduledDate },
    { name: "scheduled_time", value: booking.scheduledTime || "TBD" },
    { name: "amount", value: `₹${booking.amount}` },
    { name: "booking_id", value: booking.id.slice(-8) },
  ]);
}

export async function sendDayBeforeReminder(booking) {
  return sendWhatsAppMessage(booking.customerPhone, "DAY_BEFORE_REMINDER", [
    { name: "customer_name", value: booking.customerName },
    { name: "pooja_title", value: booking.poojaTitle },
    { name: "scheduled_time", value: formatTo12Hour(booking.scheduledTime) },
  ]);
}

export async function sendMorningReminder(booking) {
  return sendWhatsAppMessage(booking.customerPhone, "MORNING_REMINDER", [
    { name: "customer_name", value: booking.customerName },
    { name: "pooja_title", value: booking.poojaTitle },
    { name: "scheduled_time", value: formatTo12Hour(booking.scheduledTime) },
  ]);
}

/**
 * ✅ 1-hour-before reminder — dispatched by the reminder cron processor
 */
export async function sendOneHourBefore(booking) {
  return sendWhatsAppMessage(booking.customerPhone, "ONE_HOUR_BEFORE", [
    { name: "customer_name", value: booking.customerName },
    { name: "pooja_title", value: booking.poojaTitle },
    // removed scheduled_time — template doesn't have it
  ]);
}

export async function sendFeedbackRequest(booking, feedbackLink) {
  return sendWhatsAppMessage(booking.customerPhone, "FEEDBACK_REQUEST", [
    { name: "customer_name", value: booking.customerName },
    { name: "pooja_title", value: booking.poojaTitle },
    { name: "feedback_link", value: feedbackLink },
  ]);
}

/**
 * ✅ Completion message — picks template based on poojaType.
 * We NEVER store the PDF — we only forward the link the admin pastes.
 */
export async function sendCompletionCertificate(booking, certificateLink, videoLink) {
  if (booking.poojaType === "ONLINE") {
    return sendWhatsAppMessage(booking.customerPhone, "COMPLETION_ONLINE", [
      { name: "customer_name", value: booking.customerName },
      { name: "pooja_title", value: booking.poojaTitle },
      { name: "certificate_link", value: certificateLink },
      { name: "video_link", value: videoLink || "Not available" },
    ]);
  }

  return sendWhatsAppMessage(booking.customerPhone, "COMPLETION_CERTIFICATE", [
    { name: "customer_name", value: booking.customerName },
    { name: "pooja_title", value: booking.poojaTitle },
    { name: "certificate_link", value: certificateLink },
  ]);
}
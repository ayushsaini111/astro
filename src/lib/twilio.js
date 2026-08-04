// backend/src/lib/twilio.js
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendOTP(phone) {
  return await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID) // ✅ Correct variable name
    .verifications.create({
      to: `+91${phone}`,
      channel: "sms",
    });
}

export async function verifyOTP(phone, otp) {
  return await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID) // ✅ Correct variable name
    .verificationChecks.create({
      to: `+91${phone}`,
      code: otp,
    });
}
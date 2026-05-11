import { sendOTP } from "@/lib/twilio";

export async function POST(req) {
  const { phone } = await req.json();

  await sendOTP(phone);

  return Response.json({ success: true });
}
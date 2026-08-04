// backend/src/app/api/auth/sendotps/route.js
import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/twilio";

// ✅ Handle OPTIONS (preflight) requests
export async function OPTIONS(request) {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req) {
  try {
    const { phone } = await req.json();

    console.log("📞 Send OTP request for:", phone);

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    await sendOTP(phone);

    console.log("✅ OTP sent successfully to:", phone);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("❌ Send OTP error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to send OTP." },
      { status: 500 }
    );
  }
}
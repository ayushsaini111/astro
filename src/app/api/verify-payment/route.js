import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReminders } from "@/services/reminders";
import { sendBookingConfirmation } from "@/services/whatsapp";

// Map pooja mode → poojaType enum (ONLINE | OFFLINE)
function getPoojaType(mode) {
  if (!mode) return "OFFLINE";
  const m = mode.toLowerCase();
  if (m.includes("video") || m.includes("online") || m.includes("call")) return "ONLINE";
  return "OFFLINE";
}

// Map time slot key → actual clock time string
function mapSlotToTime(slot) {
  const map = {
    "8-12":       "08:00",
    "12-15":      "12:00",
    "15-19":      "15:00",
    "19-22":      "19:00",
    "SLOT_8_12":  "08:00",
    "SLOT_12_15": "12:00",
    "SLOT_15_19": "15:00",
    "SLOT_19_22": "19:00",
  };
  return map[slot] || "10:00";
}

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userDetails,
      pooja,
      selectedDate,
      selectedTimeSlot,
      userId,
    } = await request.json();

    // ── 1. Validate required fields ───────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment details" },
        { status: 400 }
      );
    }

    // ── 2. Verify Razorpay signature ──────────────────────────────────────
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // ── 3. Map fields correctly ───────────────────────────────────────────
    const bookingId    = `RNT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const poojaType    = getPoojaType(pooja.mode);          // ✅ "ONLINE" | "OFFLINE"
    const scheduledTime = mapSlotToTime(selectedTimeSlot);  // ✅ "08:00", "15:00" etc.

    console.log("📦 Creating booking:", {
      bookingId,
      poojaType,
      scheduledDate: selectedDate,
      scheduledTime,
    });

    // ── 4. Save booking to database ───────────────────────────────────────
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        userId:       userId || "guest",
        poojaId:      Number(pooja.id),
        poojaTitle:   pooja.title,
        poojaType,                                    // ✅ was poojaMode (wrong field)
        poojaImage:   pooja.image    || null,
        duration:     pooja.duration || null,
        amount:       Math.round(Number(pooja.offer_price)),
        originalPrice: pooja.price
          ? Math.round(Number(pooja.price))
          : null,
        discount: pooja.price
          ? Math.round(Number(pooja.price) - Number(pooja.offer_price))
          : null,
        customerName:  userDetails.name,
        customerPhone: userDetails.phone,
        customerEmail: userDetails.email,
        houseNo:   userDetails.houseNo   || null,
        address:   userDetails.address   || null,
        landmark:  userDetails.landmark  || null,
        pinCode:   userDetails.pinCode   || null,
        scheduledDate:  selectedDate,
        scheduledTime,                               // ✅ was timeSlot (wrong field)
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:        "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    console.log("✅ Booking created:", booking.id);

    // ── 5. Update user profile if logged in ───────────────────────────────
    if (userId && userId !== "guest") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name:     userDetails.name     || undefined,
          email:    userDetails.email    || undefined,
          houseNo:  userDetails.houseNo  || undefined,
          address:  userDetails.address  || undefined,
          landmark: userDetails.landmark || undefined,
          pinCode:  userDetails.pinCode  || undefined,
        },
      });
    }

    // ── 6. Send WhatsApp confirmation ─────────────────────────────────────
    try {
      await sendBookingConfirmation(booking);
      console.log("✅ WhatsApp confirmation sent");
    } catch (e) {
      console.error("⚠️ WhatsApp confirmation failed (non-fatal):", e.message);
    }

    // ── 7. Schedule reminders ─────────────────────────────────────────────
 // ✅ In verify-payment route — log full error
try {
  await createReminders(
    booking.id,
    booking.scheduledDate,
    booking.scheduledTime
  );
  console.log("✅ Reminders scheduled");
} catch (e) {
  // Log full error including stack trace
  console.error("⚠️ Reminder scheduling failed (non-fatal):", e);
}

    // ── 8. Return success ─────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: {
        id:            booking.id,
        bookingId:     booking.bookingId,
        poojaTitle:    booking.poojaTitle,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        amount:        booking.amount,
        status:        booking.status,
      },
    });
  } catch (error) {
    console.error("💥 Error verifying payment:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
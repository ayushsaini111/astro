import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReminders } from "@/services/reminders";
import { sendBookingConfirmation } from "@/services/whatsapp";
import { getActiveRedeemCode, computeDiscount, creditCommission } from "@/lib/redeem"; // ✅ NEW
import { sendNotification } from "@/lib/notifications/send";
function getPoojaType(mode) {
  if (!mode) return "OFFLINE";
  const m = mode.toLowerCase();
  if (m.includes("video") || m.includes("online") || m.includes("call")) return "ONLINE";
  return "OFFLINE";
}

function mapSlotToTime(slot) {
  const map = {
    "8-12": "08:00", "12-15": "12:00", "15-19": "15:00", "19-22": "19:00",
    "SLOT_8_12": "08:00", "SLOT_12_15": "12:00", "SLOT_15_19": "15:00", "SLOT_19_22": "19:00",
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
      redeemCode, // ✅ NEW — works for online & offline poojas (same table)
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment details" },
        { status: 400 }
      );
    }

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

    const bookingId    = `RNT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const poojaType    = getPoojaType(pooja.mode);
    const scheduledTime = mapSlotToTime(selectedTimeSlot);

    // ✅ Recompute discount server-side (never trust only the client)
    const redeem = await getActiveRedeemCode(redeemCode);
    const baseAmount = Math.round(Number(pooja.offer_price) * 100); // paise
    const { payableAmount, discountAmount } = computeDiscount(baseAmount, redeem?.discountPercent ?? 0);

    console.log("📦 Creating booking:", { bookingId, poojaType, scheduledDate: selectedDate, scheduledTime, redeemCode: redeem?.code });

    const booking = await prisma.booking.create({
      data: {
        bookingId,
        userId:       userId || "guest",
        poojaId:      Number(pooja.id),
        poojaTitle:   pooja.title,
        poojaType,
        poojaImage:   pooja.image    || null,
        duration:     pooja.duration || null,
        amount:       Math.round(payableAmount / 100), // ✅ discounted amount actually paid
        originalPrice: pooja.price
          ? Math.round(Number(pooja.price))
          : null,
        discount: Math.round(discountAmount / 100), // ✅ discount applied
        redeemCode: redeem?.code || null,            // ✅ NEW field
        customerName:  userDetails.name,
        customerPhone: userDetails.phone,
        customerEmail: userDetails.email,
        houseNo:   userDetails.houseNo   || null,
        address:   userDetails.address   || null,
        landmark:  userDetails.landmark  || null,
        pinCode:   userDetails.pinCode   || null,
        scheduledDate:  selectedDate,
        scheduledTime,
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:        "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    console.log("✅ Booking created:", booking.id);

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

    try {
      await sendBookingConfirmation(booking);
      console.log("✅ WhatsApp confirmation sent");
    } catch (e) {
      console.error("⚠️ WhatsApp confirmation failed (non-fatal):", e.message);
    }

    try {
      await createReminders(
        booking.id,
        booking.scheduledDate,
        booking.scheduledTime
      );
      console.log("✅ Reminders scheduled");
    } catch (e) {
      console.error("⚠️ Reminder scheduling failed (non-fatal):", e);
    }

    // ✅ Credit the partner who owns this redeem code — works for ONLINE & OFFLINE poojas
    if (redeem) {
      creditCommission({
        redeemCode: redeem,
        userId: userId !== "guest" ? userId : null,
        orderType: "POOJA",
        orderRefId: booking.id,
        originalAmount: baseAmount / 100,
        discountAmount: discountAmount / 100,
      }).catch((e) => console.error("⚠️ Commission credit failed (non-fatal):", e));
    }
    sendNotification({
  userId: userId && userId !== "guest" ? userId : null,
  type: "BOOKING",
  title: "🙏 Booking Confirmed",
  body: `Your booking for "${booking.poojaTitle}" on ${booking.scheduledDate} has been confirmed.`,
  data: { bookingId: booking.bookingId },
}).catch((e) => console.error("⚠️ Notification failed:", e));

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
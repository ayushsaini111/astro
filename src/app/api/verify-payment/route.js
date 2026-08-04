import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTimeSlotEnum, getPoojaModeEnum } from "@/lib/timeSlots";

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

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing payment details",
        },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    // Generate unique booking ID
    const bookingId = `RNT${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Convert time slot and mode to enum
    const timeSlotEnum = getTimeSlotEnum(selectedTimeSlot);
    const poojaModeEnum = getPoojaModeEnum(pooja.mode);

    // Save booking to database
    const booking = await prisma.booking.create({
      data: {
        bookingId,
        userId: userId || "guest",

        // Pooja details
        poojaId: pooja.id,
        poojaTitle: pooja.title,
        poojaMode: poojaModeEnum,
        poojaImage: pooja.image || null,
        duration: pooja.duration || null,

        // Pricing
        amount: pooja.offerPrice,
        originalPrice: pooja.price || null,
        discount: pooja.price ? pooja.price - pooja.offerPrice : null,

        // Customer details
        customerName: userDetails.name,
        customerPhone: userDetails.phone,
        customerEmail: userDetails.email,

        // Address (for on-site)
        houseNo: userDetails.houseNo || null,
        address: userDetails.address || null,
        landmark: userDetails.landmark || null,
        pinCode: userDetails.pinCode || null,

        // Scheduling
        scheduledDate: selectedDate,
        timeSlot: timeSlotEnum,

        // Payment
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,

        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    // Update user profile if logged in
    if (userId && userId !== "guest") {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            name: userDetails.name || undefined,
            email: userDetails.email || undefined,
            houseNo: userDetails.houseNo || undefined,
            address: userDetails.address || undefined,
            landmark: userDetails.landmark || undefined,
            pinCode: userDetails.pinCode || undefined,
          },
        });
      } catch (error) {
        console.log("Could not update user profile:", error.message);
      }
    }

    // TODO: Send confirmation email/SMS
    // await sendConfirmationEmail(booking);
    // await sendConfirmationSMS(booking);

    return NextResponse.json({
      success: true,
      message: "Payment verified and booking confirmed",
      booking: {
        bookingId: booking.bookingId,
        id: booking.id,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
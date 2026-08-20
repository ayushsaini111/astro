import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return Response.json({ success: false, error: "bookingId is required" }, { status: 400 });
    }

    let booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      return Response.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // ✅ If code missing (old booking), generate one now
    if (!booking.certificateVerificationCode) {
      booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { certificateVerificationCode: require("crypto").randomUUID() },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const certificateUrl = `${baseUrl}/api/certificates/${booking.certificateVerificationCode}`;

    return Response.json({ success: true, certificateUrl });
  } catch (error) {
    console.error("💥 Generate certificate error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
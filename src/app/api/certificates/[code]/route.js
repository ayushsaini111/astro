import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/certificate/generateCertificatePdf";

export async function GET(request, context) {
  try {
    const params = await context.params;
    const code = params.code;

    console.log("📜 Certificate requested for code:", code);

    if (!code) {
      return new Response("Certificate code is required", { status: 400 });
    }

    // ✅ Changed to findFirst (works without @unique)
    const booking = await prisma.booking.findFirst({
      where: { certificateVerificationCode: code },
    });

    if (!booking) {
      return new Response("Certificate not found. Invalid or expired code.", { status: 404 });
    }

    if (booking.status !== "COMPLETED") {
      return new Response("Certificate not yet available. Pooja must be completed first.", { status: 403 });
    }

    console.log("✅ Generating certificate for:", booking.customerName);

    const pdfBuffer = await generateCertificatePdf({
      customerName: booking.customerName,
      poojaTitle: booking.poojaTitle,
      poojaType: booking.poojaType,
      scheduledDate: booking.scheduledDate,
      bookingId: booking.id,
    });

    console.log("✅ Certificate generated, size:", pdfBuffer.length, "bytes");

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificate-${booking.customerName.replace(/\s+/g, "-")}-${booking.id.slice(-8)}.pdf"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("💥 Serve certificate error:", error);
    return new Response(`Failed to generate certificate: ${error.message}`, { status: 500 });
  }
}
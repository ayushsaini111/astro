import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateCertificatePdf({
  customerName,
  poojaTitle,
  poojaType,
  scheduledDate,
  bookingId,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const purple = rgb(0.576, 0.2, 0.918);
  const gold = rgb(0.83, 0.686, 0.216);
  const dark = rgb(0.13, 0.13, 0.16);

  page.drawRectangle({
    x: 20, y: 20, width: width - 40, height: height - 40,
    borderColor: purple, borderWidth: 4,
  });
  page.drawRectangle({
    x: 34, y: 34, width: width - 68, height: height - 68,
    borderColor: gold, borderWidth: 1.5,
  });

  const brandText = "RANTRAA";
  const brandSize = 22;
  const brandWidth = fontBold.widthOfTextAtSize(brandText, brandSize);
  page.drawText(brandText, {
    x: (width - brandWidth) / 2, y: height - 90, size: brandSize, font: fontBold, color: purple,
  });

  const titleText = "CERTIFICATE OF COMPLETION";
  const titleSize = 26;
  const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2, y: height - 130, size: titleSize, font: fontBold, color: dark,
  });

  page.drawLine({
    start: { x: width / 2 - 100, y: height - 145 },
    end: { x: width / 2 + 100, y: height - 145 },
    thickness: 2, color: gold,
  });

  const certLine = "This is to certify that";
  const certLineWidth = fontRegular.widthOfTextAtSize(certLine, 14);
  page.drawText(certLine, {
    x: (width - certLineWidth) / 2, y: height - 200, size: 14, font: fontRegular, color: dark,
  });

  const safeCustomerName = sanitizeWinAnsi(customerName);
  const nameSize = getFittingFontSize(safeCustomerName, fontBold, 30, width - 160);
  const nameWidth = fontBold.widthOfTextAtSize(safeCustomerName, nameSize);
  page.drawText(safeCustomerName, {
    x: (width - nameWidth) / 2, y: height - 245, size: nameSize, font: fontBold, color: purple,
  });

  const completedLine = "has successfully completed the";
  const completedWidth = fontRegular.widthOfTextAtSize(completedLine, 14);
  page.drawText(completedLine, {
    x: (width - completedWidth) / 2, y: height - 285, size: 14, font: fontRegular, color: dark,
  });

  const safePoojaTitle = sanitizeWinAnsi(poojaTitle);
  const poojaSize = getFittingFontSize(safePoojaTitle, fontBold, 22, width - 140);
  const poojaWidth = fontBold.widthOfTextAtSize(safePoojaTitle, poojaSize);
  page.drawText(safePoojaTitle, {
    x: (width - poojaWidth) / 2, y: height - 320, size: poojaSize, font: fontBold, color: dark,
  });

  const modeLabel = poojaType === "ONLINE" ? "(Performed via Video Call)" : "(Performed at Home)";
  const modeWidth = fontItalic.widthOfTextAtSize(modeLabel, 12);
  page.drawText(modeLabel, {
    x: (width - modeWidth) / 2, y: height - 342, size: 12, font: fontItalic, color: dark,
  });

  page.drawText(`Date: ${sanitizeWinAnsi(scheduledDate)}`, {
    x: 80, y: 80, size: 12, font: fontRegular, color: dark,
  });

  const certificateId = bookingId ? bookingId.slice(-8).toUpperCase() : "UNKNOWN";
  const idText = `Certificate ID: ${certificateId}`;
  const idWidth = fontRegular.widthOfTextAtSize(idText, 12);
  page.drawText(idText, {
    x: width - 80 - idWidth, y: 80, size: 12, font: fontRegular, color: dark,
  });

  page.drawLine({
    start: { x: width - 260, y: 120 }, end: { x: width - 80, y: 120 },
    thickness: 1, color: dark,
  });
  page.drawText("Authorized Signature", {
    x: width - 240, y: 100, size: 10, font: fontRegular, color: dark,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function getFittingFontSize(text, font, preferredSize, maxWidth) {
  let size = preferredSize;
  while (size > 12 && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 1;
  }
  return size;
}

function sanitizeWinAnsi(value) {
  return String(value ?? "").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim();
}
import { prisma } from "@/lib/prisma";

const MAX_DISCOUNT_PERCENT = 50;
const RAZORPAY_MIN_AMOUNT = 100; // 100 paise = ₹1 — Razorpay's hard floor for INR orders

/** Single indexed lookup — reused by calls/poojas/plans/products */
export async function getActiveRedeemCode(codeRaw) {
  if (!codeRaw) return null;
  const code = String(codeRaw).trim().toUpperCase();
  if (!code) return null;

  const redeemCode = await prisma.redeemCode.findUnique({
    where: { code },
    include: { partner: true },
  });

  if (!redeemCode || !redeemCode.isActive || !redeemCode.partner?.isActive) {
    return null;
  }
  return redeemCode;
}

/** amountInPaise → { payableAmount, discountAmount } (integers, paise) */
export function computeDiscount(amountInPaise, discountPercent) {
  const pct = Math.min(discountPercent, MAX_DISCOUNT_PERCENT);
  let discountAmount = Math.round((amountInPaise * pct) / 100);
  let payableAmount = amountInPaise - discountAmount;

  // ✅ Never let a discount push the payable amount below Razorpay's minimum.
  // If it would, clamp payable to the minimum (or original amount if that's even smaller)
  // and recompute the discount accordingly — avoids 500 errors on low-priced items.
  if (payableAmount < RAZORPAY_MIN_AMOUNT) {
    payableAmount = Math.min(amountInPaise, RAZORPAY_MIN_AMOUNT);
    discountAmount = amountInPaise - payableAmount;
  }

  return { payableAmount, discountAmount };
}
/**
 * Credits the PARTNER WHO OWNS redeemCode — atomic + idempotent.
 * Amounts in RUPEES. Safe to call multiple times (dedupe via @@unique constraint).
 */
export async function creditCommission({
  redeemCode,
  userId,
  orderType,      // 'PLAN' | 'POOJA' | 'PRODUCT' | 'WALLET_RECHARGE'
  orderRefId,
  originalAmount, // rupees, pre-discount
  discountAmount, // rupees
}) {
  if (!redeemCode) return null;

  const commissionAmount = Number(
    ((originalAmount * redeemCode.commissionPercent) / 100).toFixed(2)
  );

  try {
    const [ledger] = await prisma.$transaction([
      prisma.commissionLedger.create({
        data: {
          partnerId: redeemCode.partnerId, // ✅ always the code's owner
          redeemCodeId: redeemCode.id,
          userId: userId || null,
          orderType,
          orderRefId,
          originalAmount,
          discountAmount,
          commissionAmount,
        },
      }),
      prisma.partner.update({
        where: { id: redeemCode.partnerId },
        data: { walletBalance: { increment: commissionAmount } },
      }),
      prisma.redeemCode.update({
        where: { id: redeemCode.id },
        data: { usageCount: { increment: 1 } },
      }),
    ]);
    return ledger;
  } catch (err) {
    if (err.code === "P2002") return null; // already credited, safe no-op
    throw err;
  }
}
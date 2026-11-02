import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";
import { getActiveRedeemCode, computeDiscount, creditCommission } from "@/lib/redeem"; // ✅ NEW
import { sendNotification } from "@/lib/notifications/send";
export async function POST(req) {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, redeemCode } = await req.json(); // ✅

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return Response.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  const existing = await prisma.transaction.findUnique({ where: { idempotencyKey: razorpay_payment_id } });
  if (existing) return Response.json({ success: true, alreadyProcessed: true });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

  const redeem = await getActiveRedeemCode(redeemCode); // ✅ recompute server-side
  const { payableAmount, discountAmount } = computeDiscount(plan.price, redeem?.discountPercent ?? 0);

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + plan.validDays);

  let actualEndDate = endDate;
  if (plan.planType === "TOPUP") {
    const activePlan = await prisma.userPlan.findFirst({
      where: { userId, isActive: true, endDate: { gte: now }, plan: { planType: "MONTHLY" } },
    });
    if (activePlan) actualEndDate = activePlan.endDate;
  }

  const [transaction, userPlan] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId,
        amount: payableAmount / 100, // ✅ actual discounted amount
        type: "DEBIT",
        purpose: "PLAN",
        status: "SUCCESS",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        idempotencyKey: razorpay_payment_id,
        redeemCode: redeem?.code || null, // ✅
      },
    }),
    prisma.userPlan.create({
      data: {
        userId,
        planId,
        remainingSeconds: plan.seconds,
        startDate: now,
        endDate: actualEndDate,
        isActive: true,
        redeemCode: redeem?.code || null, // ✅
      },
    }),
  ]);

  if (redeem) { // ✅ fire-and-forget
    creditCommission({
      redeemCode: redeem,
      userId,
      orderType: "PLAN",
      orderRefId: userPlan.id,
      originalAmount: plan.price / 100,
      discountAmount: discountAmount / 100,
    }).catch((e) => console.error("Commission credit failed:", e));
  }
sendNotification({
  userId,
  type: "PLAN",
  title: "🎉 Plan Activated",
  body: `Your "${plan.name}" plan is now active.`,
  data: { userPlanId: userPlan.id },
}).catch((e) => console.error("Notification failed:", e));
  return Response.json({ success: true, userPlan, discountApplied: discountAmount > 0 });
}
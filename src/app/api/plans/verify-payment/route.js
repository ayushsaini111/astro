import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req) {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = await req.json();

  // ── VERIFY SIGNATURE ──
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return Response.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  // ── IDEMPOTENCY: check not already processed ──
  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey: razorpay_payment_id },
  });
  if (existing) return Response.json({ success: true, alreadyProcessed: true });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + plan.validDays);

  // For topup: match active monthly plan's endDate
  let actualEndDate = endDate;
  if (plan.planType === "TOPUP") {
    const activePlan = await prisma.userPlan.findFirst({
      where: {
        userId,
        isActive: true,
        endDate: { gte: now },
        plan: { planType: "MONTHLY" },
      },
    });
    if (activePlan) actualEndDate = activePlan.endDate;
  }

  // ── CREATE TRANSACTION + USERPLAN in one tx ──
  const [transaction, userPlan] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId,
        amount: plan.price / 100, // store in rupees
        type: "DEBIT",
        purpose: "PLAN",
        status: "SUCCESS",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        idempotencyKey: razorpay_payment_id,
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
      },
    }),
  ]);

  return Response.json({ success: true, userPlan });
}

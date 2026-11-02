import { getRazorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveRedeemCode, computeDiscount } from "@/lib/redeem"; // ✅ NEW

export async function POST(req) {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, redeemCode } = await req.json(); // ✅ redeemCode

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

  const redeem = await getActiveRedeemCode(redeemCode); // ✅
  const { payableAmount, discountAmount } = computeDiscount(plan.price, redeem?.discountPercent ?? 0); // ✅

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: payableAmount, // ✅ discounted
      currency: "INR",
      receipt: `plan_${planId}_${userId}_${Date.now()}`.slice(0, 40),
      notes: { planId, userId, redeemCode: redeem?.code || "" },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
      discountApplied: discountAmount > 0, // ✅
      discountAmount,                      // ✅
    });
  } catch (e) {
    console.error("Razorpay order error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
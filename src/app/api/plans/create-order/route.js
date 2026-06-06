import { getRazorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: plan.price,
      currency: "INR",
      receipt: `plan_${planId}_${userId}_${Date.now()}`.slice(0, 40),
      notes: { planId, userId },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (e) {
    console.error("Razorpay order error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

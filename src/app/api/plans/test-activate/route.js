import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  // ✅ SAFETY — this route only works when test mode is explicitly on
  if (process.env.PAYMENT_TEST_MODE !== "true") {
    return Response.json({ error: "Not available" }, { status: 403 });
  }

  let userId = req.headers.get("x-user-id");
  if (!userId) {
    const cookieStore = await cookies();
    userId = cookieStore.get("userId")?.value;
  }
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

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
        amount: 0, // ✅ clearly marked as free/test, not a lie about real payment
        type: "DEBIT",
        purpose: "PLAN_TEST",
        status: "SUCCESS",
        idempotencyKey: `test_${userId}_${planId}_${Date.now()}`,
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

  return Response.json({ success: true, userPlan, testMode: true });
}
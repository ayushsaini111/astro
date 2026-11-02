import { prisma } from "@/lib/prisma";
import { getRazorpay } from "@/lib/razorpay";

// 👉 THIS is the only backend number — it decides the REAL amount Razorpay charges.
// Keep this in sync with COMMUNITY_PRICE_LABEL in src/constants/community.js (frontend).
export const COMMUNITY_AMOUNT_PAISE = 200; // ₹79/month

const PLAN_KEY = "community_plan";

export async function getOrCreateCommunityPlan() {
  const cached = await prisma.systemState.findUnique({ where: { key: PLAN_KEY } });
  if (cached?.value?.planId && cached?.value?.amount === COMMUNITY_AMOUNT_PAISE) {
    return cached.value.planId;
  }

  const razorpay = getRazorpay();

  const plan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: "Community Membership",
      amount: COMMUNITY_AMOUNT_PAISE,
      currency: "INR",
      description: "Monthly auto-renewing community membership",
    },
  });

  await prisma.systemState.upsert({
    where: { key: PLAN_KEY },
    update: { value: { planId: plan.id, amount: COMMUNITY_AMOUNT_PAISE }, updatedAt: new Date() },
    create: {
      id: PLAN_KEY,
      key: PLAN_KEY,
      value: { planId: plan.id, amount: COMMUNITY_AMOUNT_PAISE },
      updatedAt: new Date(),
    },
  });

  return plan.id;
}
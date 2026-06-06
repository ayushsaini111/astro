// app/plans/page.jsx
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }

  let plans = [];
  let status = null;

  try {
    plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    console.log("Plans found:", plans.length);

    if (userId) {
      const now = new Date();
      const freeUsage = await prisma.freeCallUsage.findUnique({ where: { userId } });
      const activePlans = await prisma.userPlan.findMany({
        where: { userId, isActive: true, endDate: { gte: now }, remainingSeconds: { gt: 0 } },
        include: { plan: true },
      });
status = {
  hasFreeCall: !freeUsage,
  activePlans: activePlans.map((up) => ({
    name: up.plan.name,
    remainingSeconds: up.remainingSeconds,   // ✅ seconds not minutes
    endDate: up.endDate,
    perDayLimit: up.plan.perDayLimit,
    perDayUsedSeconds: up.perDayUsedSeconds, // ✅ seconds
  })),
};
    }
  } catch (e) {
    console.error("PlansPage error:", e);
  }

  return <PlansClient plans={plans} status={status} userId={userId} />;
}

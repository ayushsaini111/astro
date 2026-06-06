import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const today = new Date(now.toDateString());

  const freeUsage = await prisma.freeCallUsage.findUnique({ where: { userId } });

  const activePlans = await prisma.userPlan.findMany({
    where: { userId, isActive: true, endDate: { gte: now }, remainingSeconds: { gt: 0 } },
    include: { plan: true },
    orderBy: { endDate: "asc" },
  });

  // Reset perDayUsedSeconds on new day
  for (const up of activePlans) {
    if (up.plan.planType === "TOPUP" && up.lastUsedDate) {
      const lastUsed = new Date(up.lastUsedDate.toDateString());
      if (lastUsed < today) {
        await prisma.userPlan.update({
          where: { id: up.id },
          data: { perDayUsedSeconds: 0, lastUsedDate: null },
        });
        up.perDayUsedSeconds = 0;
      }
    }
  }

  // ✅ FIXED: availableSeconds respects perDay cap for UI/blocking purposes
  // but raw remainingSeconds is also returned for in-call balance checks
  let availableSeconds = 0;
  for (const up of activePlans) {
    if (up.plan.planType === "TOPUP" && up.plan.perDayLimit) {
      const dailyLeft = up.plan.perDayLimit - up.perDayUsedSeconds;
      availableSeconds += Math.min(up.remainingSeconds, Math.max(0, dailyLeft));
    } else {
      // ✅ Non-TOPUP plans: use remainingSeconds directly, no daily cap
      availableSeconds += up.remainingSeconds;
    }
  }

  // ✅ NEW: raw total across all plans, ignoring perDay cap (used during active calls)
  const totalRemainingSeconds = activePlans.reduce(
    (sum, up) => sum + up.remainingSeconds, 0
  );

  const freeSeconds = freeUsage ? 0 : 5; // 🧪 change to 300 for production

  return Response.json({
    hasFreeCall: !freeUsage,
    freeSeconds,
    activePlans: activePlans.map((up) => ({
      id: up.id,
      name: up.plan.name,
      remainingSeconds: up.remainingSeconds,
      perDayLimit: up.plan.perDayLimit,
      perDayUsedSeconds: up.perDayUsedSeconds,
      endDate: up.endDate,
      planType: up.plan.planType,
    })),
    availableSeconds,
    totalRemainingSeconds, // ✅ NEW field — use this in AgoraCall balance check
    totalSeconds: freeUsage ? availableSeconds : availableSeconds + freeSeconds,
  });
}
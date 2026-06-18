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

  let availableSeconds = 0;
  for (const up of activePlans) {
    if (up.plan.planType === "TOPUP") {
      const dailyLeft = (up.plan.perDayLimit ?? 0) - up.perDayUsedSeconds;
      availableSeconds += Math.min(up.remainingSeconds, Math.max(0, dailyLeft));
    } else {
      availableSeconds += up.remainingSeconds;
    }
  }

  const hasFreeCall = !freeUsage && activePlans.length === 0;
  const freeSeconds = hasFreeCall ? 5 : 0; // 🧪 change to 300 for production

  return Response.json({
    hasFreeCall,
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
    totalSeconds: hasFreeCall ? availableSeconds + freeSeconds : availableSeconds,
  });
}
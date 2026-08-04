// backend/src/app/api/call/balance/route.js

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req) {
  try {
    // ─── Auth ────────────────────────────────────────────────────────────────
    let userId = req.headers.get("x-user-id");

    if (!userId) {
      const cookieStore = await cookies();
      userId = cookieStore.get("userId")?.value;
    }

    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    }

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // ─── Check free call ─────────────────────────────────────────────────────
    const freeUsage = await prisma.freeCallUsage.findUnique({
      where: { userId },
    });

    const hasFreeCall = !freeUsage;

    // ─── Get active plans ────────────────────────────────────────────────────
    const activePlans = await prisma.userPlan.findMany({
      where: {
        userId,
        isActive: true,
        endDate: { gte: now },
        remainingSeconds: { gt: 0 },
      },
      orderBy: { endDate: "asc" },
      include: {
        plan: {
          select: { name: true, perDayLimit: true },
        },
      },
    });

    let totalSeconds = 0;
    const planDetails = [];

    for (const userPlan of activePlans) {
      const plan = userPlan.plan;
      let availableSeconds = userPlan.remainingSeconds;

      // Check daily limit
      if (plan.perDayLimit) {
        const today = new Date().toDateString();
        const lastUsed = userPlan.lastUsedDate
          ? new Date(userPlan.lastUsedDate).toDateString()
          : null;

        // Reset daily usage if it's a new day
        if (lastUsed !== today) {
          availableSeconds = Math.min(availableSeconds, plan.perDayLimit);
        } else {
          const dailyRemaining = plan.perDayLimit - (userPlan.perDayUsedSeconds || 0);
          availableSeconds = Math.min(availableSeconds, dailyRemaining);
        }
      }

      totalSeconds += availableSeconds;
      planDetails.push({
        planId: userPlan.id,
        name: plan.name,
        remainingSeconds: userPlan.remainingSeconds,
        availableSeconds,
        perDayLimit: plan.perDayLimit,
        perDayUsed: userPlan.perDayUsedSeconds || 0,
      });
    }

    return Response.json({
      userId,
      hasFreeCall,
      totalSeconds,
      plans: planDetails,
      canCall: hasFreeCall || totalSeconds > 0,
    });
  } catch (err) {
    console.error("❌ Balance API error:", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
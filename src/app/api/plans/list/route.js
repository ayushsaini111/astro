// backend/src/app/api/plans/list/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Get userId from header (from frontend)
    const userId = req.headers.get('x-user-id');

    // Fetch plans
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });

    let status = null;

    // If user is logged in, get their status
    if (userId) {
      const now = new Date();
      const freeUsage = await prisma.freeCallUsage.findUnique({ 
        where: { userId } 
      });

      const activePlans = await prisma.userPlan.findMany({
        where: { 
          userId, 
          isActive: true, 
          endDate: { gte: now }, 
          remainingSeconds: { gt: 0 } 
        },
        include: { plan: true },
      });

      status = {
        hasFreeCall: !freeUsage,
        activePlans: activePlans.map((up) => ({
          name: up.plan.name,
          remainingSeconds: up.remainingSeconds,
          endDate: up.endDate,
          perDayLimit: up.plan.perDayLimit,
          perDayUsedSeconds: up.perDayUsedSeconds,
        })),
      };
    }

    return NextResponse.json({ plans, status });
  } catch (error) {
    console.error("Plans list error:", error);
    return NextResponse.json(
      { error: "Failed to load plans" }, 
      { status: 500 }
    );
  }
}
// backend/src/app/api/plans/buy/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Get userId from header
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();
    
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.validDays);

    let actualEndDate = endDate;
    if (plan.planType === "TOPUP") {
      const activePlan = await prisma.userPlan.findFirst({
        where: { 
          userId, 
          isActive: true, 
          endDate: { gte: now }, 
          plan: { planType: "MONTHLY" } 
        },
      });
      if (activePlan) actualEndDate = activePlan.endDate;
    }

    const userPlan = await prisma.userPlan.create({
      data: {
        userId,
        planId,
        remainingSeconds: plan.seconds,
        startDate: now,
        endDate: actualEndDate,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, userPlan });
  } catch (error) {
    console.error("Buy plan error:", error);
    return NextResponse.json(
      { error: "Failed to buy plan" }, 
      { status: 500 }
    );
  }
}
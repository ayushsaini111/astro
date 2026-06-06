// import { prisma } from "@/lib/prisma";
// import { cookies } from "next/headers";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

// export async function POST(req) {
//   // Auth
//   const cookieStore = await cookies();
//   let userId = cookieStore.get("userId")?.value;
//   if (!userId) {
//     const session = await getServerSession(authOptions);
//     userId = session?.user?.id;
//   }
//   if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

//   const { planId } = await req.json();

//   const plan = await prisma.plan.findUnique({ where: { id: planId } });
//   if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

//   const now = new Date();
//   const endDate = new Date(now);
//   endDate.setDate(endDate.getDate() + plan.validDays);

//   // For topup: if monthly plan active, match its endDate
//   let actualEndDate = endDate;
//   if (plan.planType === "topup") {
//     const activePlan = await prisma.userPlan.findFirst({
//       where: {
//         userId,
//         isActive: true,
//         endDate: { gte: now },
//         plan: { planType: "monthly" },
//       },
//       include: { plan: true },
//     });
//     if (activePlan) actualEndDate = activePlan.endDate; // match monthly plan
//   }

//   const userPlan = await prisma.userPlan.create({
//     data: {
//       userId,
//       planId,
//       remainingSeconds: plan.seconds,
//       startDate: now,
//       endDate: actualEndDate,
//       isActive: true,
//     },
//   });

//   return Response.json({ success: true, userPlan });
// } 

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

  const userPlan = await prisma.userPlan.create({
    data: {
      userId,
      planId,
      remainingSeconds: plan.seconds,  // ✅ seconds
      startDate: now,
      endDate: actualEndDate,
      isActive: true,
    },
  });

  return Response.json({ success: true, userPlan });
}

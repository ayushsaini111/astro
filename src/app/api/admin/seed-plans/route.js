import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.userPlan.deleteMany();
    await prisma.plan.deleteMany();

    const plans = [
      { name: "Test - 1 min",      seconds: 60,    price: 100,    validDays: 1,   planType: "TOPUP",   perDayLimit: 60,   includes: [] },
      { name: "Top-Up 5 min/day",  seconds: 300,   price: 9900,   validDays: 1,   planType: "TOPUP",   perDayLimit: 300,  includes: [] },
      { name: "Top-Up 10 min/day", seconds: 600,   price: 16900,  validDays: 1,   planType: "TOPUP",   perDayLimit: 600,  includes: [] },
      { name: "1 Month - 30 min",  seconds: 1800,  price: 39900,  validDays: 30,  planType: "MONTHLY", perDayLimit: null, includes: [] },
      { name: "3 Month - 1 hr",    seconds: 3600,  price: 109900, validDays: 90,  planType: "MONTHLY", perDayLimit: null, includes: ["Pooja", "Rudraksha"] },
      { name: "3 Month - 1.5 hr",  seconds: 5400,  price: 104900, validDays: 90,  planType: "MONTHLY", perDayLimit: null, includes: ["Rudraksha"] },
      { name: "6 Month - 3 hr",    seconds: 10800, price: 269900, validDays: 180, planType: "MONTHLY", perDayLimit: null, includes: ["Hawan Video", "Rudraksha"] },
      { name: "1 Year - 10 hr",    seconds: 36000, price: 649900, validDays: 365, planType: "YEARLY",  perDayLimit: null, includes: ["Invitation to Hawan", "Rudraksha"] },
    ];

    await prisma.plan.createMany({ data: plans, skipDuplicates: true });
    const count = await prisma.plan.count();
    return Response.json({ success: true, count });
  } catch (e) {
    console.error("SEED ERROR:", e.message);
    console.error(e);
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}

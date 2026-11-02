import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications/send";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  if (authHeader !== expectedAuth) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const expiringPlans = await prisma.userPlan.findMany({
      where: { isActive: true, expiryNotified: false, endDate: { gte: now, lte: in24h } },
      include: { plan: { select: { name: true } } },
      take: 200,
    });

    const results = await Promise.allSettled(
      expiringPlans.map(async (up) => {
        await sendNotification({
          userId: up.userId,
          type: "RECHARGE_EXPIRY",
          title: "⏰ Your plan expires soon",
          body: `Your "${up.plan.name}" plan expires in less than 24 hours. Recharge now to avoid interruption!`,
          data: { userPlanId: up.id },
        });
        await prisma.userPlan.update({ where: { id: up.id }, data: { expiryNotified: true } });
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return Response.json({ success: true, processed: expiringPlans.length, sent });
  } catch (error) {
    console.error("💥 Plan expiry cron error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
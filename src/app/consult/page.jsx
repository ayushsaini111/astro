import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConsultClient from "@/components/consult/ConsultClient";

export default async function ConsultPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");
  if (session.user.role === "pandit") redirect("/pandit");

  // Google users have email, OTP users have id from JWT
  const user = await prisma.user.findUnique({
    where: session.user.email
      ? { email: session.user.email }
      : { id: session.user.id },
    include: {
      plans: {
        where: { endDate: { gte: new Date() }, remainingSeconds: { gt: 0 } },
        include: { plan: true },
        take: 1,
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.username ) redirect("/username");

  const pandits = await prisma.pandit.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: "desc" },
  });

  const activePlan = user.plans[0]
    ? {
        name: user.plans[0].plan.name,
        remainingSeconds: user.plans[0].remainingSeconds,
        endDate: user.plans[0].endDate,
      }
    : { name: "Free Test", remainingSeconds: 999 };

  return (
    <ConsultClient
      pandits={pandits}
      userPlan={activePlan}
      userId={user.id}
    />
  );
}
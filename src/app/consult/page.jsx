import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import ConsultClient from "@/components/consult/ConsultClient";

export default async function ConsultPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const session = await getServerSession(authOptions);

  let user = null;

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        plans: {
          where: { endDate: { gte: new Date() }, remainingMinutes: { gt: 0 } },
          include: { plan: true },
          take: 1,
        },
      },
    });
  }

  if (!user && session?.user?.email) {
    if (session.user.role === "pandit") redirect("/pandit");
    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        plans: {
          where: { endDate: { gte: new Date() }, remainingMinutes: { gt: 0 } },
          include: { plan: true },
          take: 1,
        },
      },
    });
  }

  if (!user) redirect("/login");
  if (!user.username || !user.dob) redirect("/username");

  const pandits = await prisma.pandit.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: "desc" },
  });

  const activePlan = user.plans[0]
    ? {
        name: user.plans[0].plan.name,
        remainingMinutes: user.plans[0].remainingMinutes,
        endDate: user.plans[0].endDate,
      }
    : { name: "Free Test", remainingMinutes: 999 };

  return (
    <ConsultClient
      pandits={pandits}
      userPlan={activePlan}
      username={user.username}
      userId={user.id}
      profilePic={user.profilePic}
    />
  );
}
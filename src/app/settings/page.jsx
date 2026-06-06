import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      dob: true,
      profilePic: true,
      createdAt: true,
      plans: {
        where: { isActive: true, endDate: { gte: new Date() }, remainingSeconds: { gt: 0 } },
        include: { plan: true },
        take: 1,
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <SettingsClient user={{
      ...user,
      dob: user.dob ? user.dob.toISOString().split("T")[0] : "",
      createdAt: user.createdAt.toISOString(),
      activePlan: user.plans[0] ? {
        name: user.plans[0].plan.name,
        remainingSeconds: user.plans[0].remainingSeconds,
        endDate: user.plans[0].endDate.toISOString(),
      } : null,
    }} />
  );
}
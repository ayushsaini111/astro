import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: session.user.email
      ? { email: session.user.email }
      : { id: session.user.id },
    include: {
      wallet: true,
      plans: {
        where: { isActive: true, endDate: { gte: new Date() } },
        include: { plan: true },
        take: 1,
      },
    },
  });

  if (!user) redirect("/login");

  return <ProfileClient user={{
    id:         user.id,
    username:   user.username,
    email:      user.email,
    phone:      user.phone,
    dob:        user.dob?.toISOString()      ?? null,
    profilePic: user.profilePic,
    gender:     user.gender                  ?? null,
    address:    user.address                 ?? null,
    isVerified: user.isVerified,
    createdAt:  user.createdAt.toISOString(),
    wallet:     user.wallet ? { balance: user.wallet.balance } : null,
    activePlan: user.plans[0] ? {
      name:             user.plans[0].plan.name,
      remainingSeconds: user.plans[0].remainingSeconds,
      endDate:          user.plans[0].endDate.toISOString(),
    } : null,
  }} />;
}
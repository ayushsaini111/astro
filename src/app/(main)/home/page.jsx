import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  // Try NextAuth session (Google login)
  const session = await getServerSession(authOptions);

  console.log("🏠 home userId cookie:", userId);
  console.log("🏠 home session:", session?.user?.email);

  let user = null;

  // 1. Cookie first (OTP users)
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        plans: {
          where: {
            endDate: { gte: new Date() },
            remainingMinutes: { gt: 0 },
          },
          include: { plan: true },
          take: 1,
        },
      },
    });
  }

  // 2. Session (Google users)
  if (!user && session?.user?.email) {
    // Block pandits
    if (session.user.role === "pandit") redirect("/pandit");

    user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        plans: {
          where: {
            endDate: { gte: new Date() },
            remainingMinutes: { gt: 0 },
          },
          include: { plan: true },
          take: 1,
        },
      },
    });
  }

  console.log("🏠 home user from DB:", user);

  // Not logged in at all
  if (!user) {
    console.log("❌ No user found — redirecting to login");
    redirect("/login");
  }

  // Profile incomplete
  if (!user.username || !user.dob) {
    console.log("❌ Profile incomplete — redirecting to username");
    redirect("/username");
  }

  const pandits = await prisma.pandit.findMany({
    where: { isAvailable: true },
    orderBy: { createdAt: "desc" },
  });

  const activePlan = user?.plans[0]
    ? {
        name: user.plans[0].plan.name,
        remainingMinutes: user.plans[0].remainingMinutes,
        endDate: user.plans[0].endDate,
      }
    : {
        name: "Free Test",
        remainingMinutes: 999,
      };

  return (
    <HomeClient
      pandits={pandits}
      userPlan={activePlan}
      username={user.username}
      userId={user.id}
       profilePic={user.profilePic}
    />
  );
}
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CallHistoryClient from "./CallHistoryClient";

export default async function CallHistoryPage() {
  const cookieStore = await cookies();
  let userId = cookieStore.get("userId")?.value;
  if (!userId) {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id;
  }
  if (!userId) redirect("/login");

  const calls = await prisma.call.findMany({
    where: {
      userId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      duration: true,
      billableSeconds: true,
      isFreeCall: true,
      billingType: true,
      createdAt: true,
      pandit: {
        select: { name: true, speciality: true, profilePic: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <CallHistoryClient calls={calls.map(c => ({
    ...c,
    startTime: c.startTime?.toISOString() ?? null,
    endTime: c.endTime?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }))} />;
}
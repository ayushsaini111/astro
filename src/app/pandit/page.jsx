import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PanditDashboard from "./PanditDashboard";

export default async function PanditPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const pandit = await prisma.pandit.findUnique({
    where: { email: session.user.email },
  });

  if (!pandit) redirect("/login");

  return <PanditDashboard pandit={pandit} />;
}
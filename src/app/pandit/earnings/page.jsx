import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EarningsPage() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const pandit =
    await prisma.pandit.findUnique({
      where: {
        email: session.user.email,
      },
    });

  const calls =
    await prisma.call.findMany({
      where: {
        panditId: pandit.id,
        status: "COMPLETED",
      },
    });

  const totalSeconds = calls.reduce(
    (sum, c) =>
      sum + (c.duration || 0),
    0
  );

  const totalMinutes =
    totalSeconds / 60;

  const totalEarnings = calls.reduce(
    (sum, c) =>
      sum + (c.totalCost || 0),
    0
  );

  const avgDuration =
    calls.length > 0
      ? totalMinutes / calls.length
      : 0;

  const avgEarning =
    calls.length > 0
      ? totalEarnings / calls.length
      : 0;

  const freeCalls = calls.filter(
    (c) => c.isFreeCall
  ).length;

  const paidCalls = calls.filter(
    (c) => !c.isFreeCall
  ).length;

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-10">
        Earnings Analytics
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <AnalyticsCard
          title="Total Earnings"
          value={`₹${totalEarnings.toFixed(
            2
          )}`}
        />

        <AnalyticsCard
          title="Total Minutes"
          value={totalMinutes.toFixed(1)}
        />

        <AnalyticsCard
          title="Completed Calls"
          value={calls.length}
        />

        <AnalyticsCard
          title="Avg Call Duration"
          value={`${avgDuration.toFixed(
            1
          )} min`}
        />

        <AnalyticsCard
          title="Avg Earning / Call"
          value={`₹${avgEarning.toFixed(
            2
          )}`}
        />

        <AnalyticsCard
          title="Free vs Paid"
          value={`${freeCalls} / ${paidCalls}`}
        />
      </div>
    </div>
  );
}

function AnalyticsCard({
  title,
  value,
}) {
  return (
    <div className="bg-white border rounded-3xl p-8">
      <p className="text-gray-500">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-4">
        {value}
      </h2>
    </div>
  );
}
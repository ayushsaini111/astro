import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HistoryPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const pandit = await prisma.pandit.findUnique({
    where: { email: session.user.email },
  });

  if (!pandit) {
    redirect("/login");
  }

  const params = await searchParams;
  const showAll = params?.showAll === "true";

  // ✅ Paginated calls for display (10 or all)
  const calls = await prisma.call.findMany({
    where: { panditId: pandit.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    ...(showAll ? {} : { take: 10 }),
  });

  // ✅ ALL calls for stats — never paginated, always accurate
  const allCallsForStats = await prisma.call.findMany({
    where: { panditId: pandit.id },
    select: {
      duration: true,
      status: true,
    },
  });

  // ✅ Stats always based on full history
  const totalCalls = allCallsForStats.length;
  const completedCalls = allCallsForStats.filter(
    (c) => c.status === "COMPLETED"
  ).length;
  const totalDurationSeconds = allCallsForStats.reduce(
    (sum, c) => sum + (c.duration || 0),
    0
  );
  const totalMinutes = Math.floor(totalDurationSeconds / 60);
  const totalSeconds = totalDurationSeconds % 60;

  const resolveUsername = (call) =>
    call.user?.username || call.deletedUsername || "Deleted User";

  const getEndedByName = (call) => {
    if (!call.endedBy) return "Unknown";
    if (call.endedBy === "USER") return resolveUsername(call);
    if (call.endedBy === "PANDIT") return "You";
    if (call.endedBy === "SYSTEM") return "System";
    if (call.userId && call.endedBy === call.userId) return resolveUsername(call);
    if (call.endedBy === call.panditId) return "You";
    return call.endedBy;
  };

  return (
    <div className="min-h-screen bg-background p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-main">Call History</h1>
        <p className="text-secondary mt-2">
          {showAll
            ? `Showing all ${calls.length} calls`
            : `Latest ${calls.length} calls`}
        </p>
      </div>

      {/* ✅ STATS — always full history, never affected by pagination */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-black/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-main">{totalCalls}</p>
          <p className="text-secondary text-sm mt-1">Total Calls</p>
        </div>
        <div className="bg-white border border-black/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-main">{completedCalls}</p>
          <p className="text-secondary text-sm mt-1">Completed</p>
        </div>
        <div className="bg-white border border-black/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-main">
            {totalMinutes}m {totalSeconds}s
          </p>
          <p className="text-secondary text-sm mt-1">Total Time</p>
        </div>
      </div>

      {/* CALLS LIST */}
      <div className="space-y-5">
        {calls.map((call) => {
          const duration = call.duration || 0;
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          const username = resolveUsername(call);
          const isDeleted = !call.user;

          return (
            <div
              key={call.id}
              className="bg-white border border-black/10 rounded-[32px] p-6"
            >
              <div className="flex items-start justify-between gap-6">

                {/* LEFT */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-main">
                      {username}
                    </h2>
                    {isDeleted && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400 border border-red-200">
                        Account Deleted
                      </span>
                    )}
                  </div>

                  <p className="text-secondary mt-1">
                    {new Date(call.createdAt).toLocaleString("en-IN")}
                  </p>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className={`
                      px-3 py-1 rounded-full text-sm
                      ${call.status === "COMPLETED"
                        ? "bg-green-50 text-green-600"
                        : call.status === "ONGOING"
                        ? "bg-blue-50 text-blue-600"
                        : call.status === "FAILED"
                        ? "bg-red-50 text-red-500"
                        : "bg-black/5 text-main"
                      }
                    `}>
                      {call.status}
                    </div>

                    <div className="px-3 py-1 rounded-full bg-black/5 text-sm">
                      {call.billingType}
                    </div>

                    <div className="px-3 py-1 rounded-full bg-black/5 text-sm">
                      Ended by: {getEndedByName(call)}
                    </div>

                    {call.isFreeCall && (
                      <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm border border-amber-200">
                        Free Call
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right shrink-0">
                  <p className="text-3xl font-bold text-main">
                    {minutes}m {seconds}s
                  </p>
                  <p className="text-secondary mt-1 text-sm">Duration</p>
                  {call.totalCost != null && call.totalCost > 0 && (
                    <p className="text-sm font-medium text-green-600 mt-1">
                      ₹{call.totalCost.toFixed(2)}
                    </p>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        {/* EMPTY */}
        {calls.length === 0 && (
          <div className="bg-white border border-black/10 rounded-[32px] p-20 text-center">
            <p className="text-2xl font-semibold text-main">No Call History</p>
            <p className="text-secondary mt-2">Completed calls will appear here</p>
          </div>
        )}
      </div>

      {/* SHOW ALL */}
      {!showAll && calls.length >= 10 && (
        <div className="flex justify-center mt-10">
          <Link
            href="/pandit/history?showAll=true"
            className="px-8 py-4 rounded-full bg-primary-main text-white font-medium hover:opacity-90 transition-all"
          >
            Show All History
          </Link>
        </div>
      )}

      {/* SHOW LESS */}
      {showAll && calls.length > 10 && (
        <div className="flex justify-center mt-10">
          <Link
            href="/pandit/history"
            className="px-8 py-4 rounded-full bg-black/10 text-main font-medium hover:bg-black/20 transition-all"
          >
            Show Less
          </Link>
        </div>
      )}

    </div>
  );
}
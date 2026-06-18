"use client";
import { useState, useEffect } from "react";
import RequestsHeader from "@/components/Pandits/Header";
import CategoryTabs from "@/components/Pandits/CategoryTabs";

const CATEGORIES = [
  { key: "today", label: "Today" },
  { key: "thisWeek", label: "This Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "all", label: "All Time" },
];

export default function HistoryPage() {
  const [activeCategory, setActiveCategory] = useState("today");
  const [allCalls, setAllCalls] = useState([]);
  const [panditData, setPanditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // ✅ Load history data
  const loadHistory = async () => {
    try {
      const [historyRes, profileRes] = await Promise.all([
        fetch(`/api/pandit/history?showAll=${showAll}`),
        fetch("/api/pandit/profile"),
      ]);

      const [historyData, profileData] = await Promise.all([
        historyRes.json(),
        profileRes.json(),
      ]);

      if (historyRes.ok) {
        setAllCalls(historyData.calls || []);
      }

      if (profileRes.ok) {
        setPanditData(profileData);
      }
    } catch (e) {
      console.error("Error loading history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [showAll]);

  // ✅ Get date ranges
  const now = new Date();
  const today = new Date(now.toDateString());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ✅ Determine if call is missed
  const isMissedCall = (call) => {
    // Missed if: status is FAILED and NOT picked up (no startTime) and NOT declined by pandit
    if (call.status === "FAILED") {
      // Not picked up (never started)
      if (!call.startTime) {
        return true;
      }
      // Picked up but ended (call was ongoing at some point)
      return false;
    }
    return false;
  };

  // ✅ Filter by time category
  const getFilteredCalls = () => {
    return allCalls.filter((call) => {
      const callDate = new Date(call.createdAt);
      const callDateOnly = new Date(callDate.toDateString());

      if (activeCategory === "today") {
        return callDateOnly.getTime() === today.getTime();
      }
      if (activeCategory === "thisWeek") {
        return callDateOnly >= weekStart;
      }
      if (activeCategory === "thisMonth") {
        return callDateOnly >= monthStart;
      }
      if (activeCategory === "all") {
        return true;
      }
      return true;
    });
  };

  const filteredCalls = getFilteredCalls();

  // ✅ Group calls by date
  const groupCallsByDate = () => {
    const grouped = {};

    filteredCalls.forEach((call) => {
      const callDate = new Date(call.createdAt);
      const dateKey = callDate.toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(call);
    });

    return grouped;
  };

  const groupedCalls = groupCallsByDate();
  const sortedDates = Object.keys(groupedCalls).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // ✅ Category counts
  const categoryCounts = {
    today: allCalls.filter((c) => {
      const callDate = new Date(c.createdAt);
      return new Date(callDate.toDateString()).getTime() === today.getTime();
    }).length,
    thisWeek: allCalls.filter((c) => {
      const callDate = new Date(c.createdAt);
      return new Date(callDate.toDateString()) >= weekStart;
    }).length,
    thisMonth: allCalls.filter((c) => {
      const callDate = new Date(c.createdAt);
      return new Date(callDate.toDateString()) >= monthStart;
    }).length,
    all: allCalls.length,
  };

  // ✅ Stats (always from full history)
  const stats = {
    totalCalls: allCalls.length,
    completedCalls: allCalls.filter((c) => c.status === "COMPLETED").length,
    missedCalls: allCalls.filter((c) => isMissedCall(c)).length,
    totalDurationSeconds: allCalls.reduce((sum, c) => sum + (c.duration || 0), 0),
  };

  const totalMinutes = Math.floor(stats.totalDurationSeconds / 60);
  const totalSeconds = stats.totalDurationSeconds % 60;

  // ✅ Helper functions
  const resolveUsername = (call) =>
    call.user?.username || call.deletedUsername || "Deleted User";

  const getCallType = (call) => {
    if (call.status === "COMPLETED") {
      return { type: "Completed", icon: "✓", color: "text-green-600" };
    }

    const missed = isMissedCall(call);
    if (missed) {
      return { type: "Missed", icon: "×", color: "text-red-600" };
    }

    // Declined or not picked up but tried
    return { type: "Declined", icon: "⊘", color: "text-orange-600" };
  };

  const getEndedByName = (call) => {
    if (!call.endedBy) return "Unknown";
    if (call.endedBy === "USER") return resolveUsername(call);
    if (call.endedBy === "PANDIT") return "You";
    if (call.endedBy === "SYSTEM") return "System";
    if (call.userId && call.endedBy === call.userId) return resolveUsername(call);
    if (call.endedBy === call.panditId) return "You";
    return call.endedBy;
  };

  // ✅ Get human-readable date
  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const todayDate = new Date(today.toDateString());
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    if (date.getTime() === todayDate.getTime()) {
      return "Today";
    }
    if (date.getTime() === yesterdayDate.getTime()) {
      return "Yesterday";
    }

    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // ✅ Subheading text
  const subheading = `${filteredCalls.length} call${
    filteredCalls.length !== 1 ? "s" : ""
  }`;

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-7xl mx-auto">
      {/* Header with Toggle */}
      <RequestsHeader
        heading="Call History"
        subheading={subheading}
        panditData={panditData}
        showProfileOnMobile={true}
      />

      {/* ✅ STATS — always full history */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-main">{stats.totalCalls}</p>
          <p className="text-secondary text-xs mt-2">Total Calls</p>
        </div>
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.completedCalls}</p>
          <p className="text-secondary text-xs mt-2">Completed</p>
        </div>
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.missedCalls}</p>
          <p className="text-secondary text-xs mt-2">Missed</p>
        </div>
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-main">
            {totalMinutes}m {totalSeconds}s
          </p>
          <p className="text-secondary text-xs mt-2">Total Time</p>
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        counts={categoryCounts}
      />

      {/* Loading State */}
      {loading && (
        <div className="text-center mt-24 text-secondary">
          <div className="inline-block w-8 h-8 border-4 border-primary-main/30 border-t-primary-main rounded-full animate-spin mb-4" />
          <p className="caption">Loading history...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCalls.length === 0 && (
        <div className="text-center mt-24 text-secondary">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/5 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-main mb-1">
            No calls in this period
          </p>
          <p className="caption">Calls will appear here once you have history</p>
        </div>
      )}

      {/* Calls List Grouped by Date */}
      <div className="flex flex-col gap-6">
        {sortedDates.map((dateString) => (
          <div key={dateString}>
            {/* Date Header */}
            <h3 className="text-sm font-semibold text-main mb-3 px-1">
              {getDateLabel(dateString)}
            </h3>

            {/* Calls for this date */}
            <div className="flex flex-col gap-3">
              {groupedCalls[dateString].map((call) => {
                const duration = call.duration || 0;
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                const username = resolveUsername(call);
                const isDeleted = !call.user;
                const callType = getCallType(call);
                const missed = isMissedCall(call);

                const statusColor = missed
                  ? "bg-red-50 text-red-600"
                  : call.status === "COMPLETED"
                  ? "bg-green-50 text-green-600"
                  : "bg-orange-50 text-orange-600";

                return (
                  <div
                    key={call.id}
                    className={`border rounded-[var(--R24)] p-4 ${
                      missed
                        ? "bg-red-50/30 border-red-200/50"
                        : "bg-white border-black/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                      {/* LEFT */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-base font-semibold text-main truncate">
                            {username}
                          </h2>
                          {isDeleted && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-400 border border-red-200 whitespace-nowrap">
                              Deleted
                            </span>
                          )}
                          {missed && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 whitespace-nowrap font-medium">
                              Missed Call
                            </span>
                          )}
                        </div>

                        <p className="text-secondary text-xs mb-3">
                          {new Date(call.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {callType.type}
                          </div>

                          <div className="px-2.5 py-1 rounded-full bg-black/5 text-xs text-secondary">
                            {call.billingType}
                          </div>

                          {!missed && (
                            <div className="px-2.5 py-1 rounded-full bg-black/5 text-xs text-secondary">
                              {getEndedByName(call)}
                            </div>
                          )}

                          {call.isFreeCall && (
                            <div className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs border border-amber-200">
                              Free Call
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RIGHT */}
                      <div className="text-right shrink-0">
                        {!missed && duration > 0 ? (
                          <>
                            <p className="text-2xl font-bold text-main">
                              {minutes}m {seconds}s
                            </p>
                            <p className="text-secondary text-xs mt-1">Duration</p>
                            {call.totalCost != null && call.totalCost > 0 && (
                              <p className="text-xs font-medium text-green-600 mt-1">
                                ₹{call.totalCost.toFixed(2)}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-2xl font-bold text-red-600">0m 0s</p>
                            <p className="text-secondary text-xs mt-1">Not Answered</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* SHOW ALL / SHOW LESS */}
      {!showAll && filteredCalls.length >= 10 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowAll(true)}
            className="px-6 py-2.5 rounded-full bg-primary-main text-white text-sm font-medium hover:bg-primary-main/90 transition-colors"
          >
            Show All History
          </button>
        </div>
      )}

      {showAll && filteredCalls.length > 10 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowAll(false)}
            className="px-6 py-2.5 rounded-full bg-black/10 text-main text-sm font-medium hover:bg-black/20 transition-colors"
          >
            Show Less
          </button>
        </div>
      )}
    </div>
  );
}
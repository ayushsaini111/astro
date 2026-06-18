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

export default function EarningsPage() {
  const [activeCategory, setActiveCategory] = useState("today");
  const [allTransactions, setAllTransactions] = useState([]);
  const [panditData, setPanditData] = useState(null);
  const [panditInfo, setPanditInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Load earnings data
  const loadEarnings = async () => {
    try {
      setLoading(true);
      setError(null);

      const [earningsRes, profileRes] = await Promise.all([
        fetch("/api/pandit/earnings"),
        fetch("/api/pandit/profile"),
      ]);

      const earningsData = await earningsRes.json();
      const profileData = await profileRes.json();

      console.log("🎯 Earnings Data:", earningsData);
      console.log("👤 Profile Data:", profileData);

      if (earningsRes.ok) {
        setAllTransactions(earningsData.transactions || []);
        setPanditInfo(earningsData.pandit);
      } else {
        setError(earningsData.error || "Failed to load earnings");
      }

      if (profileRes.ok) {
        setPanditData(profileData);
      }
    } catch (e) {
      console.error("Error loading earnings:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  // ✅ Get date ranges
  const now = new Date();
  const today = new Date(now.toDateString());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ✅ Filter by time category
  const getFilteredTransactions = () => {
    return allTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      const transactionDateOnly = new Date(transactionDate.toDateString());

      if (activeCategory === "today") {
        return transactionDateOnly.getTime() === today.getTime();
      }
      if (activeCategory === "thisWeek") {
        return transactionDateOnly >= weekStart;
      }
      if (activeCategory === "thisMonth") {
        return transactionDateOnly >= monthStart;
      }
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // ✅ Calculate stats for filtered transactions
  const getStats = (transactions) => {
    const totalEarnings = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalSeconds = transactions.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalMinutes = totalSeconds / 60;
    const completedCalls = transactions.length;
    const avgDuration = completedCalls > 0 ? totalMinutes / completedCalls : 0;
    const avgEarning = completedCalls > 0 ? totalEarnings / completedCalls : 0;

    return {
      totalEarnings: totalEarnings.toFixed(2),
      totalMinutes: totalMinutes.toFixed(1),
      completedCalls,
      avgDuration: avgDuration.toFixed(1),
      avgEarning: avgEarning.toFixed(2),
    };
  };

  const currentStats = getStats(filteredTransactions);

  // ✅ Paginate transactions
  const displayedTransactions = showAllTransactions
    ? filteredTransactions
    : filteredTransactions.slice(0, 5);

  // ✅ Category counts
  const getCategoryCount = (cat) => {
    return allTransactions.filter((t) => {
      const transactionDate = new Date(t.createdAt);
      const transactionDateOnly = new Date(transactionDate.toDateString());

      if (cat === "today") {
        return transactionDateOnly.getTime() === today.getTime();
      }
      if (cat === "thisWeek") {
        return transactionDateOnly >= weekStart;
      }
      if (cat === "thisMonth") {
        return transactionDateOnly >= monthStart;
      }
      return true;
    }).length;
  };

  const categoryCounts = {
    today: getCategoryCount("today"),
    thisWeek: getCategoryCount("thisWeek"),
    thisMonth: getCategoryCount("thisMonth"),
    all: allTransactions.length,
  };

  const subheading = "Track your consultation income";

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <RequestsHeader
        heading="Earnings"
        subheading={subheading}
        panditData={panditData}
        showProfileOnMobile={true}
      />

      {/* Info Banner */}
      {panditInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-[var(--R24)] p-4 mb-6">
          <p className="text-xs text-blue-600">
            💡 Your rate: <span className="font-bold">₹{panditInfo.ratePerMin}/minute</span>
          </p>
        </div>
      )}

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
          <p className="caption">Loading earnings...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-[var(--R24)] p-6 text-center mt-24">
          <p className="text-lg font-medium text-red-700 mb-2">Error Loading Earnings</p>
          <p className="caption text-red-600 mb-4">{error}</p>
          <button
            onClick={loadEarnings}
            className="px-4 py-2 bg-primary-main text-white rounded-full text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && allTransactions.length === 0 && (
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-main mb-1">No earnings yet</p>
          <p className="caption">Complete calls to start earning</p>
        </div>
      )}

      {/* STATS CARDS */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-[var(--R24)] p-5">
            <p className="text-secondary text-sm">Total Earnings</p>
            <p className="text-3xl font-bold text-green-700 mt-2">
              ₹{currentStats.totalEarnings}
            </p>
            <p className="text-xs text-secondary mt-1">
              {currentStats.completedCalls} calls
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-[var(--R24)] p-5">
            <p className="text-secondary text-sm">Total Talk Time</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">
              {currentStats.totalMinutes}m
            </p>
            <p className="text-xs text-secondary mt-1">
              Avg {currentStats.avgDuration}m per call
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-[var(--R24)] p-5">
            <p className="text-secondary text-sm">Completed Calls</p>
            <p className="text-3xl font-bold text-purple-700 mt-2">
              {currentStats.completedCalls}
            </p>
            <p className="text-xs text-secondary mt-1">
              ₹{currentStats.avgEarning} avg
            </p>
          </div>

          <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5">
            <p className="text-secondary text-sm">Period</p>
            <p className="text-3xl font-bold text-main mt-2">
              {activeCategory === "today" && "Today"}
              {activeCategory === "thisWeek" && "This Week"}
              {activeCategory === "thisMonth" && "This Month"}
              {activeCategory === "all" && "All Time"}
            </p>
          </div>
        </div>
      )}

      {/* TRANSACTIONS LIST */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-main mb-3 px-1">
            Transactions ({filteredTransactions.length})
          </h3>

          <div className="flex flex-col gap-3">
            {displayedTransactions.map((transaction) => {
              const durationMinutes = transaction.durationMinutes || 0;
              const minutes = Math.floor(transaction.duration / 60);
              const seconds = transaction.duration % 60;

              return (
                <div
                  key={transaction.id}
                  className="bg-white border border-black/10 rounded-[var(--R24)] p-4 hover:border-primary-main/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    {/* LEFT */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-main">
                            {transaction.purpose}
                          </p>
                          <p className="text-xs text-secondary">
                            {new Date(transaction.createdAt).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-black/5 text-secondary">
                          ⏱️ {minutes}m {seconds}s
                        </span>
                        <span className="px-2 py-1 rounded-full bg-black/5 text-secondary">
                          {transaction.billingType}
                        </span>
                        {transaction.isFreeCall && (
                          <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            Free Call
                          </span>
                        )}
                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">
                          ₹{transaction.ratePerMin}/min
                        </span>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-green-600">
                        +₹{parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        {durationMinutes}m talk
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VIEW MORE */}
          {!showAllTransactions && filteredTransactions.length > 5 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAllTransactions(true)}
                className="px-6 py-2.5 rounded-full bg-primary-main text-white text-sm font-medium hover:bg-primary-main/90 transition-colors"
              >
                View More ({filteredTransactions.length - 5} more)
              </button>
            </div>
          )}

          {showAllTransactions && filteredTransactions.length > 5 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAllTransactions(false)}
                className="px-6 py-2.5 rounded-full bg-black/10 text-main text-sm font-medium hover:bg-black/20 transition-colors"
              >
                Show Less
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
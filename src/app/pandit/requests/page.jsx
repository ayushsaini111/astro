"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSSE } from "@/hooks/useSSE";
import { useSession } from "next-auth/react";
import RequestsHeader from "@/components/Pandits/Header";
import CategoryTabs from "@/components/Pandits/CategoryTabs";
import RequestCard from "@/components/Pandits/RequestCard";
import EmptyState from "@/components/Pandits/EmptyState";

const AgoraCall = dynamic(() => import("@/components/call/AgoraCall"), { ssr: false });

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "missed", label: "Missed" },
];

export default function RequestsPage() {
  const { data: session } = useSession();
  const panditId = session?.user?.id;

  // ✅ State Management
  const [activeCategory, setActiveCategory] = useState("pending");
  const [allRequests, setAllRequests] = useState([]);
  const [panditData, setPanditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callData, setCallData] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [callingBack, setCallingBack] = useState(null);
  const [forceEnd, setForceEnd] = useState(false);
  const activeCallIdRef = useRef(null);

  // ✅ Load requests + pandit data
  const loadRequests = async () => {
    try {
      const [dashboardRes, profileRes] = await Promise.all([
        fetch("/api/pandit/dashboard"),
        fetch("/api/pandit/profile"),
      ]);

      const [dashboardData, profileData] = await Promise.all([
        dashboardRes.json(),
        profileRes.json(),
      ]);

      if (dashboardRes.ok) {
        setAllRequests(dashboardData.calls || []);
      }

      if (profileRes.ok) {
        setPanditData(profileData);
      }
    } catch (e) {
      console.error("Error loading requests:", e);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Initial Load
  useEffect(() => {
    if (panditId) {
      loadRequests();
    }
  }, [panditId]);

  // ✅ SSE for real-time updates
  useSSE(`/api/events?panditId=${panditId}`, {
    "incoming-call": (data) => {
      if (activeCallIdRef.current) return;
      new Audio("/notif.mp3").play().catch(() => {});

      setAllRequests((prev) => {
        if (prev.find((r) => r.id === data.callId)) return prev;
        return [
          {
            id: data.callId,
            user: data.user,
            createdAt: data.createdAt,
            status: "INITIATED",
            displayUsername: data.user?.username || "User",
          },
          ...prev,
        ];
      });
    },
    "call-ended": (data) => {
      setAllRequests((prev) =>
        prev.map((r) => (r.id === data.callId ? { ...r, status: "FAILED" } : r))
      );

      if (activeCallIdRef.current === data.callId) {
        setForceEnd(true);
      }
    },
  });

  // ✅ Determine if call is missed
  const isMissedCall = (call) => {
    if (call.status === "FAILED" && !call.startTime) {
      return true;
    }
    return false;
  };

  // ✅ Filter by category
  const filteredRequests = allRequests.filter((req) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "pending") return ["INITIATED", "RINGING"].includes(req.status);
    if (activeCategory === "accepted") return ["ONGOING", "COMPLETED"].includes(req.status);
    if (activeCategory === "missed") return isMissedCall(req);
    return true;
  });

  // ✅ Category counts
  const categoryCounts = {
    all: allRequests.length,
    pending: allRequests.filter((r) => ["INITIATED", "RINGING"].includes(r.status)).length,
    accepted: allRequests.filter((r) => ["ONGOING", "COMPLETED"].includes(r.status)).length,
    missed: allRequests.filter((r) => isMissedCall(r)).length,
  };

  // ✅ Stats
  const stats = {
    totalCalls: allRequests.length,
    completedCalls: allRequests.filter((c) => c.status === "COMPLETED").length,
    missedCalls: allRequests.filter((c) => isMissedCall(c)).length,
    pendingCalls: allRequests.filter((r) => ["INITIATED", "RINGING"].includes(r.status)).length,
  };

  // ✅ Handle accept call
  const handleAccept = async (call) => {
    setCallingBack(call.id);
    try {
      const res = await fetch("/api/call/pandit-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id }),
      });

      const data = await res.json();

      if (res.ok) {
        activeCallIdRef.current = call.id;
        setCallerInfo({
          name: call.displayUsername || call.user?.username || "User",
          speciality: call.user?.dob
            ? `DOB: ${new Date(call.user.dob).toLocaleDateString("en-IN")}`
            : "",
        });
        setCallData(data);

        setAllRequests((prev) =>
          prev.map((c) => (c.id === call.id ? { ...c, status: "ONGOING" } : c))
        );
      } else {
        alert(data.error || "Failed to initiate call");
        setCallingBack(null);
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      alert("Something went wrong");
      setCallingBack(null);
    }
  };

  // ✅ Handle decline call
  const handleDecline = async (callId) => {
    try {
      setAllRequests((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, status: "FAILED" } : c))
      );

      const res = await fetch("/api/call/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });

      if (!res.ok) {
        console.error("Error declining call");
      }
    } catch (error) {
      console.error("Error declining call:", error);
    }
  };

  // ✅ Handle call end
  const handleCallEnd = () => {
    activeCallIdRef.current = null;
    setCallData(null);
    setCallerInfo(null);
    setForceEnd(false);
    loadRequests();
  };

  // ✅ If in call, show AgoraCall component
  if (callData) {
    return (
      <AgoraCall
        callData={callData}
        callerInfo={callerInfo}
        forceEnd={forceEnd}
        onEnd={handleCallEnd}
      />
    );
  }

  // ✅ Subheading text
  const subheading = `${filteredRequests.length} ${
    activeCategory === "all" ? "total" : activeCategory
  } request${filteredRequests.length !== 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-7xl mx-auto">
      {/* Header with Toggle */}
      <RequestsHeader
        heading="Call Requests"
        subheading={subheading}
        panditData={panditData}
        showProfileOnMobile={true}
      />

      {/* ✅ STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-main">{stats.totalCalls}</p>
          <p className="text-secondary text-xs mt-2">Total Calls</p>
        </div>
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingCalls}</p>
          <p className="text-secondary text-xs mt-2">Pending</p>
        </div>
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.completedCalls}</p>
          <p className="text-secondary text-xs mt-2">Completed</p>
        </div>
        <div className="bg-white border border-black/10 rounded-[var(--R24)] p-5 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.missedCalls}</p>
          <p className="text-secondary text-xs mt-2">Missed</p>
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
          <p className="caption">Loading requests...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRequests.length === 0 && (
        <EmptyState category={activeCategory} />
      )}

      {/* Requests List */}
      <div className="flex flex-col gap-3">
        {filteredRequests.map((call) => (
          <RequestCard
            key={call.id}
            call={call}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isProcessing={callingBack === call.id}
            isMissed={isMissedCall(call)}
          />
        ))}
      </div>
    </div>
  );
}
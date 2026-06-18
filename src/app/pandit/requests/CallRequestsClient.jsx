"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSSE } from "@/hooks/useSSE";
import { useSession } from "next-auth/react";
import RequestsHeader from "@/components/pandit/RequestsHeader";
import CategoryTabs from "@/components/pandit/CategoryTabs";
import RequestCard from "@/components/pandit/RequestCard";
import EmptyState from "@/components/pandit/EmptyState";

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
  async function loadRequests() {
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (panditId) loadRequests();
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

  // ✅ Filter by category
  const filteredRequests = allRequests.filter((req) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "pending") return ["INITIATED", "RINGING"].includes(req.status);
    if (activeCategory === "accepted") return ["ONGOING", "COMPLETED"].includes(req.status);
    if (activeCategory === "missed") return req.status === "FAILED";
    return true;
  });

  // ✅ Category counts
  const categoryCounts = {
    all: allRequests.length,
    pending: allRequests.filter((r) => ["INITIATED", "RINGING"].includes(r.status)).length,
    accepted: allRequests.filter((r) => ["ONGOING", "COMPLETED"].includes(r.status)).length,
    missed: allRequests.filter((r) => r.status === "FAILED").length,
  };

  // ✅ Handle accept call
  async function handleAccept(call) {
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
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setCallingBack(null);
    }
  }

  // ✅ Handle decline
  async function handleDecline(callId) {
    setAllRequests((prev) =>
      prev.map((c) => (c.id === callId ? { ...c, status: "FAILED" } : c))
    );

    await fetch("/api/call/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId }),
    });
  }

  // ✅ If in call
  if (callData) {
    return (
      <AgoraCall
        callData={callData}
        callerInfo={callerInfo}
        forceEnd={forceEnd}
        onEnd={() => {
          activeCallIdRef.current = null;
          setCallData(null);
          setCallerInfo(null);
          setForceEnd(false);
          loadRequests();
        }}
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
          />
        ))}
      </div>
    </div>
  );
}
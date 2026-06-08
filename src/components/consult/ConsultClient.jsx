"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/useSSE";
import CallExpertsSection from "@/components/consult/CallExpertsSection";
import ConsultBottomSection from "@/components/consult/ConsultBottomSection";
import PageHeader from "@/components/PageHeader";

const AgoraCall = dynamic(() => import("@/components/call/AgoraCall"), { ssr: false });

export default function ConsultClient({ pandits, userPlan, username, userId, profilePic }) {
  const [loadingId, setLoadingId] = useState(null);
  const [requestedCalls, setRequestedCalls] = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(sessionStorage.getItem("requestedCalls") ?? "{}"); }
    catch { return {}; }
  });
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallData, setActiveCallData] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [forceEnd, setForceEnd] = useState(false);
  const ringtoneRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const router = useRouter();

  // ✅ Persist requestedCalls to sessionStorage
  function updateRequestedCalls(updater) {
    setRequestedCalls(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { sessionStorage.setItem("requestedCalls", JSON.stringify(next)); } catch { }
      return next;
    });
  }

  useEffect(() => {
    const audio = new Audio("/ringtone.mp3");
    audio.loop = true;
    ringtoneRef.current = audio;
    return () => audio.pause();
  }, []);

  // ✅ On mount, verify any persisted requests are still valid
  useEffect(() => {
    const saved = Object.entries(requestedCalls);
    if (saved.length === 0) return;

    // Check each saved callId status
    Promise.all(
      saved.map(async ([panditId, callId]) => {
        try {
          const res = await fetch(`/api/call/status?callId=${callId}`);
          const data = await res.json();
          if (data.status === "FAILED" || data.status === "COMPLETED") {
            return panditId; // should be removed
          }
        } catch { }
        return null;
      })
    ).then(toRemove => {
      const stale = toRemove.filter(Boolean);
      if (stale.length > 0) {
        updateRequestedCalls(prev => {
          const next = { ...prev };
          stale.forEach(id => delete next[id]);
          return next;
        });
      }
    });
  }, []); // run once on mount

  useSSE(userId ? `/api/events?userId=${userId}` : null, {
    "call-ringing": (data) => {
      setIncomingCall({
        id: data.callId,
        channelName: data.channelName,
        token: data.token,
        uid: data.uid,
        appId: data.appId,
        pandit: data.pandit,
        isFreeCall: data.isFreeCall,
        planSecondsLeft: data.planSecondsLeft,
      });
      ringtoneRef.current?.play().catch(() => { });
    },
    "call-accepted": (data) => {
      ringtoneRef.current?.pause();
      setIncomingCall(null);
      updateRequestedCalls({});
      setActiveCallData(data);
    },
    "call-ended": () => {
      ringtoneRef.current?.pause();
      ringtoneRef.current && (ringtoneRef.current.currentTime = 0);
      setIncomingCall(null);
      updateRequestedCalls({});
      if (activeCallData) {
        setForceEnd(true);
      } else {
        setActiveCallData(null);
      }
    },
  });

  function unlockAudio() {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    const a = ringtoneRef.current;
    if (!a) return;
    a.muted = true;
    a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { });
  }

  async function handleRequestCall(pandit) {
    unlockAudio();
    setLoadingId(pandit.id);
    try {
      const res = await fetch("/api/call/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panditId: pandit.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "NO_BALANCE") { router.push("/plans"); return; }
        if (data.error === "DAILY_LIMIT_REACHED") { alert("⏰ " + data.message); return; }
        if (data.error === "INCOMPLETE_PROFILE") { router.push("/profile"); return; }
        alert(data.error || "Failed to request call");
        return;
      }
      updateRequestedCalls(prev => ({ ...prev, [pandit.id]: data.callId }));
    } catch { alert("Something went wrong"); }
    finally { setLoadingId(null); }
  }

  async function handleAccept() {
    if (!incomingCall || accepting) return;
    setAccepting(true);
    ringtoneRef.current?.pause();
    try {
      const res = await fetch("/api/call/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: incomingCall.id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to connect"); return; }
      setActiveCallData({ ...data, pandit: incomingCall.pandit });
      setIncomingCall(null);
    } catch { alert("Something went wrong"); }
    finally { setAccepting(false); }
  }

  async function handleReject() {
    if (!incomingCall) return;
    ringtoneRef.current?.pause();
    const callId = incomingCall.id;
    setIncomingCall(null);
    await fetch("/api/call/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId }),
    });
  }

  async function handleCancelRequest() {
    const entries = Object.entries(requestedCalls);
    updateRequestedCalls({});
    for (const [, callId] of entries) {
      await fetch("/api/call/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });
    }
  }

  if (activeCallData) {
    return (
      <AgoraCall
        callData={activeCallData}
        callerInfo={activeCallData?.pandit}
        forceEnd={forceEnd}
        onEnd={() => {
          setActiveCallData(null);
          setIncomingCall(null);
          updateRequestedCalls({});
          setForceEnd(false);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background md:space-y-s40">
      <PageHeader title="Consult" subtitle="Talk to verified spiritual experts" />

      <div className="max-w-7xl mx-auto flex flex-col gap-s40">
        <div className="flex flex-col gap-s40 lg:grid lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="flex flex-col gap-s40">
            <div className="px-s16">
              <CallExpertsSection pandits={pandits} requestedCalls={requestedCalls} loadingId={loadingId} onRequestCall={handleRequestCall} userId={userId} />
            </div>
            <div className="lg:hidden"><ConsultBottomSection 
  userPlan={userPlan}
  pandits={pandits}
  onRequestCall={handleRequestCall}
  loadingId={loadingId}
/></div>
          </div>
          <div className="hidden lg:block sticky top-[120px]"><ConsultBottomSection 
  userPlan={userPlan}
  pandits={pandits}
  onRequestCall={handleRequestCall}
  loadingId={loadingId}
/></div>
        </div>
      </div>

      {Object.keys(requestedCalls).length > 0 && !incomingCall && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary-main text-white px-6 py-4 flex items-center gap-4 z-40">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">🙏</div>
          <div className="flex-1">
            <p className="text-sm font-medium">Waiting for expert...</p>
            <p className="text-xs opacity-80">You'll get a call shortly</p>
          </div>
          <button onClick={handleCancelRequest} className="text-xs underline opacity-80">Cancel</button>
        </div>
      )}

      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-between px-6 py-16">
          <div className="text-center">
            <p className="text-zinc-400 tracking-widest uppercase text-xs mb-6">Incoming Call</p>
            <div className="relative w-32 h-32 mx-auto mb-6">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping" />
              <div className="w-32 h-32 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200 font-bold text-4xl relative z-10">
                {incomingCall.pandit?.name?.slice(0, 2).toUpperCase() ?? "PA"}
              </div>
            </div>
            <p className="text-white text-2xl font-semibold">{incomingCall.pandit?.name ?? "Pandit"}</p>
            <p className="text-zinc-400 text-sm mt-1">{incomingCall.pandit?.speciality ?? "Astrologer"}</p>
          </div>
          <div className="flex gap-20 items-end pb-4">
            <div className="flex flex-col items-center gap-3">
              <button onClick={handleReject} className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-xl active:scale-95">
                <svg className="w-9 h-9 text-white" style={{ transform: "rotate(135deg)" }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              </button>
              <p className="text-zinc-400 text-sm">Decline</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button onClick={handleAccept} disabled={accepting} className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl disabled:opacity-60 active:scale-95">
                <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              </button>
              <p className="text-zinc-400 text-sm">{accepting ? "Connecting..." : "Accept"}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
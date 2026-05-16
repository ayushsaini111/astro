"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import CallExpertsSection from "@/components/consult/CallExpertsSection";
import ConsultBottomSection from "@/components/consult/ConsultBottomSection";
import PageHeader from "@/components/PageHeader";

const AgoraCall = dynamic(() => import("@/components/call/AgoraCall"), {
  ssr: false,
});

export default function ConsultClient({ pandits, userPlan, username, userId, profilePic }) {
  const [loadingId, setLoadingId] = useState(null);
  const [requestedCalls, setRequestedCalls] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallData, setActiveCallData] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const ringtoneRef = useRef(null);
  const activeCallRef = useRef(null);
  const incomingCallRef = useRef(null);
  const router = useRouter();

  // ── Pre-create ringtone + unlock on first user interaction ──
  useEffect(() => {
    const audio = new Audio("/ringtone.mp3");
    audio.loop = true;
    audio.preload = "auto";
    ringtoneRef.current = audio;
    const unlock = () => {
      audio.muted = true;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {});
    };
    window.addEventListener("click", unlock, { once: true });
    return () => { audio.pause(); };
  }, []);

  // ── Keep refs in sync ──
  useEffect(() => { activeCallRef.current = activeCallData; }, [activeCallData]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  // ── Polling every 2s ──
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      if (activeCallRef.current) return;
      try {
        const res = await fetch(`/api/call/incoming?userId=${userId}`);
        const data = await res.json();
        if (data.call) {
          if (!incomingCallRef.current) playRingtone();
          setIncomingCall(data.call);
        } else {
          if (incomingCallRef.current) {
            stopRingtone();
            setIncomingCall(null);
          }
        }
      } catch (e) { console.error("Poll error:", e); }
    }, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  function playRingtone() {
    const audio = ringtoneRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  function stopRingtone() {
    const audio = ringtoneRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  async function handleRequestCall(pandit) {
    // Unlock audio on user gesture
    const audio = ringtoneRef.current;
    if (audio) {
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1.0;
      }).catch(() => {});
    }
    setLoadingId(pandit.id);
    try {
      const res = await fetch("/api/call/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panditId: pandit.id }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to request call"); return; }
      setRequestedCalls((prev) => ({ ...prev, [pandit.id]: data.callId }));
    } catch { alert("Something went wrong"); }
    finally { setLoadingId(null); }
  }

  async function handleAccept() {
    if (!incomingCall || accepting) return;
    setAccepting(true);
    stopRingtone();
    try {
      const res = await fetch("/api/call/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: incomingCall.id }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { alert("Server error"); return; }
      if (!res.ok) { alert(data.error || "Failed to connect"); return; }
      setActiveCallData({ ...data, pandit: incomingCall.pandit });
      setIncomingCall(null);
    } catch { alert("Something went wrong"); }
    finally { setAccepting(false); }
  }

  async function handleReject() {
    if (!incomingCall) return;
    stopRingtone();
    const callId = incomingCall.id;
    setIncomingCall(null);
    await fetch("/api/call/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId }),
    });
  }

  async function handleCancelRequest() {
    const ids = Object.values(requestedCalls);
    setRequestedCalls({});
    for (const callId of ids) {
      await fetch("/api/call/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId }),
      });
    }
  }

  // ── Active call screen ──
  if (activeCallData) {
    return (
      <AgoraCall
        callData={activeCallData}
        callerInfo={activeCallData?.pandit}
        onEnd={() => { setActiveCallData(null); setIncomingCall(null); }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background md:space-y-s40">

      {/* Header */}
      <PageHeader
        title="Consult"
        subtitle="Talk to verified spiritual experts"
      />

      <div className="max-w-7xl mx-auto flex flex-col gap-s40">

        <div className="flex flex-col gap-s40 lg:grid lg:grid-cols-[1fr_420px] lg:items-start">

          {/* LEFT */}
          <div className="flex flex-col gap-s40">
            <div className="px-s16">
              {/* ✅ Pass real pandits + handler */}
              <CallExpertsSection
                pandits={pandits}
                requestedCalls={requestedCalls}
                loadingId={loadingId}
                onRequestCall={handleRequestCall}
              />
            </div>

            <div className="lg:hidden">
              <ConsultBottomSection userPlan={userPlan} />
            </div>
          </div>

          {/* RIGHT DESKTOP */}
          <div className="hidden lg:block sticky top-[120px]">
            <ConsultBottomSection userPlan={userPlan} />
          </div>

        </div>
      </div>

      {/* ── WAITING BANNER ── */}
      {Object.keys(requestedCalls).length > 0 && !incomingCall && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary-main text-white px-6 py-4 flex items-center gap-4 z-40">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">🙏</div>
          <div className="flex-1">
            <p className="text-sm font-medium">Waiting for expert...</p>
            <p className="text-xs opacity-80">You'll get a call shortly</p>
          </div>
          <button onClick={handleCancelRequest} className="text-xs underline opacity-80">
            Cancel
          </button>
        </div>
      )}

      {/* ── INCOMING CALL SCREEN ── */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-between px-6 py-16">
          <div className="text-center">
            <p className="text-zinc-400 tracking-widest uppercase text-xs mb-6">Incoming Call</p>
            <div className="relative w-32 h-32 mx-auto mb-6">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping" />
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-10 animate-ping"
                style={{ animationDelay: "0.4s", transform: "scale(1.3)" }} />
              <div className="w-32 h-32 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200 font-bold text-4xl relative z-10">
                {incomingCall.pandit?.name?.slice(0, 2).toUpperCase() ?? "PA"}
              </div>
            </div>
            <p className="text-white text-2xl font-semibold">{incomingCall.pandit?.name ?? "Pandit"}</p>
            <p className="text-zinc-400 text-sm mt-1">{incomingCall.pandit?.speciality ?? "Astrologer"}</p>
          </div>

          <div className="flex gap-20 items-end pb-4">
            <div className="flex flex-col items-center gap-3">
              <button onClick={handleReject}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/40 active:scale-95">
                <svg className="w-9 h-9 text-white" style={{ transform: "rotate(135deg)" }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              </button>
              <p className="text-zinc-400 text-sm">Decline</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button onClick={handleAccept} disabled={accepting}
                className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/40 disabled:opacity-60 active:scale-95">
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
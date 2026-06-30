"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAgora } from "@/hooks/useAgora";
import { useRouter } from "next/navigation";

const FREE_CALL_SECONDS = 5;

export default function AgoraCall({
  callData,
  callerInfo,
  onEnd,
  forceEnd,
}) {
  const {
    joined,
    remoteJoined,
    remoteLeft,
    muted,
    ready,
    error,
    joinCall,
    leaveCall,
    toggleMute,
  } = useAgora();

  const [duration, setDuration] = useState(0);
  const [ending, setEnding] = useState(false);
  const [status, setStatus] = useState("connecting");
  const [warning, setWarning] = useState(null);

  const timerRef = useRef(null);
  const freeTimerRef = useRef(null);

  const joinedRef = useRef(false);
  const callStartRef = useRef(null);
  const endingRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const freeCallEndedRef = useRef(false);
  const timerStartedRef = useRef(false); // prevents timer re-init on reconnect flaps

  const router = useRouter();

  // =========================================================
  // GET RAW REMAINING SECONDS (still used only for free-call switch-over)
  // =========================================================

  async function getRawRemainingSeconds() {
    try {
      const res = await fetch("/api/plans/status");

      if (!res.ok) {
        console.error("Plans API failed:", res.status);
        return Infinity;
      }

      const data = await res.json();

      return (data.activePlans ?? []).reduce(
        (sum, p) => sum + (p.remainingSeconds ?? 0),
        0
      );
    } catch (e) {
      console.error("Plans API error:", e);
      return Infinity;
    }
  }

  // =========================================================
  // HANDLE END
  // =========================================================

  const handleEnd = useCallback(async () => {
    if (endingRef.current) return;

    endingRef.current = true;

    setEnding(true);
    setStatus("ending");

    clearInterval(timerRef.current);
    clearInterval(freeTimerRef.current);

    const exactDuration = callStartRef.current
      ? Math.floor((Date.now() - callStartRef.current) / 1000)
      : 0;

    try {
      await leaveCall();
    } catch (e) {
      console.error(e);
    }

    try {
      await fetch("/api/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: callData.callId,
          clientDuration: exactDuration,
        }),
      });
    } catch (e) {
      console.error(e);
    }

    onEnd();
  }, [callData, leaveCall, onEnd]);

  // =========================================================
  // FORCE END
  // =========================================================

  useEffect(() => {
    if (forceEnd && !endingRef.current) {
      handleEnd();
    }
  }, [forceEnd, handleEnd]);

  // =========================================================
  // JOIN CALL
  // =========================================================

  useEffect(() => {
    if (!ready || !callData || joinedRef.current) return;

    joinedRef.current = true;

    joinCall({
      appId: callData.appId,
      token: callData.token,
      channelName: callData.channelName,
      uid: callData.uid,
    });
  }, [ready, callData, joinCall]);

  // =========================================================
  // REMOTE JOINED — starts the timer ONCE, ignores reconnect flaps
  // =========================================================

  useEffect(() => {
    if (!remoteJoined || !callData?.callId) return;

    wasConnectedRef.current = true;
    setStatus("connected");

    if (timerStartedRef.current) {
      return;
    }
    timerStartedRef.current = true;

    fetch(`/api/call/status?callId=${callData.callId}`)
      .then((r) => r.json())
      .then((serverData) => {
        const serverStart = serverData.startTime
          ? new Date(serverData.startTime).getTime()
          : Date.now();

        callStartRef.current = serverStart;

        setDuration(Math.floor((Date.now() - serverStart) / 1000));

        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
        }, 500);

        // =========================================================
        // FREE CALL TIMER — only governs the free 5s window, then
        // either silently continues on the plan or, if there is truly
        // zero balance, ends the call. This is NOT a recurring poll.
        // =========================================================

        if (callData.isFreeCall && !freeCallEndedRef.current) {
          freeTimerRef.current = setInterval(async () => {
            if (freeCallEndedRef.current || endingRef.current) {
              clearInterval(freeTimerRef.current);
              return;
            }

            const elapsed = Date.now() - callStartRef.current;

            if (elapsed >= FREE_CALL_SECONDS * 1000) {
              freeCallEndedRef.current = true;
              clearInterval(freeTimerRef.current);

              try {
                const rawSeconds = await getRawRemainingSeconds();

                if (rawSeconds > 0) {
                  setWarning("switching_to_plan");
                  setTimeout(() => setWarning(null), 3000);
                } else {
                  setWarning("no_balance");
                  setTimeout(async () => {
                    await handleEnd();
                    router.push("/plans");
                  }, 1500);
                }
              } catch (e) {
                console.error("Balance API failed:", e);
              }
            }
          }, 100);
        }
      })
      .catch(() => {
        callStartRef.current = Date.now();
        setDuration(0);

        timerRef.current = setInterval(() => {
          setDuration(Math.floor((Date.now() - callStartRef.current) / 1000));
        }, 500);
      });

    return () => {
      clearInterval(timerRef.current);
      clearInterval(freeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteJoined, callData, handleEnd, router]);

  // =========================================================
  // REAL REMOTE LEAVE
  // =========================================================

  useEffect(() => {
    if (!remoteLeft || endingRef.current) return;

    setWarning("call_cancelled");

    setTimeout(async () => {
      await handleEnd();
    }, 1500);
  }, [remoteLeft, handleEnd]);

  // =========================================================
  // WAITING STATUS
  // =========================================================

  useEffect(() => {
    if (joined && !remoteJoined && !wasConnectedRef.current) {
      setStatus("waiting");
    }
  }, [joined, remoteJoined]);

  // =========================================================
  // AUTO END IF NO ANSWER
  // =========================================================

  useEffect(() => {
    if (!joined || remoteJoined) return;

    const timeout = setTimeout(() => {
      if (!wasConnectedRef.current) {
        setWarning("no_answer");

        setTimeout(() => {
          handleEnd();
        }, 2000);
      }
    }, 60000);

    return () => clearTimeout(timeout);
  }, [joined, remoteJoined, handleEnd]);
// =========================================================
// AUTO END WHEN PLAN EXPIRES
// =========================================================

useEffect(() => {
  if (!remoteJoined) return;

  const interval = setInterval(async () => {
    const res = await fetch("/api/plans/status");
    const data = await res.json();

    const remaining = (data.activePlans ?? []).reduce(
      (sum, p) => sum + (p.remainingSeconds ?? 0),
      0
    );

    if (remaining <= 0) {
      clearInterval(interval);

      setWarning("no_balance");

      setTimeout(async () => {
        await handleEnd();
        router.push("/plans");
      }, 1000);
    }
  }, 1000);

  return () => clearInterval(interval);

}, [remoteJoined]);
  // =========================================================
  // (Removed) BALANCE CHECK POLLING
  // Previously polled /api/plans/status every 30s and ended the call
  // if rawSeconds <= 0. Removed per request — calls now only end on:
  //   - user/pandit pressing End
  //   - remote side truly leaving
  //   - no answer within 60s
  //   - the free-call 5s window expiring with zero balance
  // Actual billing is still settled correctly server-side in
  // /api/call/end, which deducts exactly the real call duration.
  // =========================================================

  // =========================================================
  // FORMAT TIME
  // =========================================================

  function formatTime(s) {
    return `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  const name = callerInfo?.name ?? callerInfo?.username ?? "Connected";
  const initials = name.slice(0, 2).toUpperCase();
  const speciality = callerInfo?.speciality ?? "";

  const statusText = {
    connecting: "Connecting...",
    waiting: "Waiting for other side...",
    connected: "Connected",
    ending: "Ending call...",
  }[status];

  const statusColor = status === "connected" ? "#34d399" : "#94a3b8";

  const warningText = {
    no_balance: "⛔ Plan over. Ending call...",
    switching_to_plan: "✅ Free call over. Continuing on your plan.",
    no_answer: "📵 No answer. Ending call...",
    call_cancelled: "📵 Call ended by other side",
  }[warning];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(180deg, #0f172a 0%, #1a1a2e 50%, #16213e 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      padding: "60px 32px 48px",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      <p style={{ color: statusColor, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", margin: 0 }}>
        {statusText}
      </p>

      {warning && (
        <div style={{
          position: "absolute", top: 100, left: 24, right: 24,
          background: ["no_balance", "no_answer", "call_cancelled"].includes(warning) ? "#7f1d1d" : "#064e3b",
          border: `1px solid ${["no_balance", "no_answer", "call_cancelled"].includes(warning) ? "#ef4444" : "#34d399"}`,
          borderRadius: 12, padding: "12px 16px",
          color: "white", fontSize: 14, fontWeight: 600,
          textAlign: "center", zIndex: 10,
        }}>
          {warningText}
        </div>
      )}

      {callData?.isFreeCall && remoteJoined && duration <= FREE_CALL_SECONDS && !warning && (
        <div style={{
          position: "absolute", top: 100, left: 24, right: 24,
          background: "rgba(52,211,153,0.15)",
          border: "1px solid rgba(52,211,153,0.3)",
          borderRadius: 12, padding: "10px 16px",
          color: "#34d399", fontSize: 13, fontWeight: 600,
          textAlign: "center",
        }}>
          Free call: {Math.max(0, FREE_CALL_SECONDS - duration)}s remaining
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", width: 140, height: 140 }}>
          {joined && (
            <>
              <div style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "rgba(52,211,153,0.1)", animation: "pulse1 2s ease-in-out infinite" }} />
              <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: "rgba(52,211,153,0.15)", animation: "pulse1 2s ease-in-out infinite", animationDelay: "0.5s" }} />
            </>
          )}
          <div style={{
            width: 140, height: 140, borderRadius: "50%",
            background: "linear-gradient(135deg, #065f46, #047857)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48, fontWeight: 700, color: "#ecfdf5",
            position: "relative", zIndex: 1,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            border: `3px solid ${remoteJoined ? "rgba(52,211,153,0.5)" : "rgba(52,211,153,0.2)"}`,
            transition: "border 0.5s",
          }}>
            {initials}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 600, margin: 0 }}>{name}</p>
          {speciality && <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{speciality}</p>}
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "8px 24px" }}>
          <p style={{ color: remoteJoined ? "#f1f5f9" : "#475569", fontSize: 22, fontFamily: "monospace", letterSpacing: 4, margin: 0 }}>
            {remoteJoined ? formatTime(duration) : "--:--"}
          </p>
        </div>

        {remoteJoined && !muted && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 32 }}>
            {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5, 1, 0.6, 0.3].map((h, i) => (
              <div key={i} style={{ width: 4, borderRadius: 4, background: "#34d399", height: `${h * 100}%`, animation: "bar 1s ease-in-out infinite alternate", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}

        {muted && <p style={{ color: "#ef4444", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Muted</p>}
        {error && <p style={{ color: "#ef4444", fontSize: 13 }}>Error: {error}</p>}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button onClick={toggleMute} style={{ width: 64, height: 64, borderRadius: "50%", border: muted ? "2px solid #ef4444" : "2px solid rgba(255,255,255,0.15)", background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 24 }}>
            {muted ? "🔇" : "🎤"}
          </button>
          <span style={{ color: "#64748b", fontSize: 12 }}>{muted ? "Unmute" : "Mute"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button onClick={handleEnd} disabled={ending} style={{ width: 80, height: 80, borderRadius: "50%", border: "none", background: ending ? "#7f1d1d" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: ending ? "not-allowed" : "pointer", fontSize: 32, boxShadow: "0 8px 32px rgba(239,68,68,0.4)", transform: "rotate(135deg)" }}>
            📞
          </button>
          <span style={{ color: "#64748b", fontSize: 12 }}>{ending ? "Ending..." : "End Call"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 24 }}>🔊</button>
          <span style={{ color: "#64748b", fontSize: 12 }}>Speaker</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse1 { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.15); opacity: 0.2; } }
        @keyframes bar { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1); } }
      `}</style>
    </div>
  );
}
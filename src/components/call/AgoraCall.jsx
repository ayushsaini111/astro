"use client";

import { useEffect, useRef, useState } from "react";
import { useAgora } from "@/hooks/useAgora";

export default function AgoraCall({ callData, callerInfo, onEnd }) {
  const { joined, remoteJoined, muted, ready, error, joinCall, leaveCall, toggleMute } = useAgora();
  const [duration, setDuration] = useState(0);
  const [ending, setEnding] = useState(false);
  const [status, setStatus] = useState("connecting");
  const timerRef = useRef(null);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!ready || !callData || joinedRef.current) return;
    joinedRef.current = true;
    console.log("📞 Joining with:", callData);
    joinCall({
      appId: callData.appId,
      token: callData.token,
      channelName: callData.channelName,
      uid: callData.uid,
    });
  }, [ready]);

  // ✅ Fixed timer — was missing setInterval body
  useEffect(() => {
    if (!remoteJoined) {
      clearInterval(timerRef.current);
      return;
    }
    setStatus("connected");
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [remoteJoined]);

  // ✅ Also update status when locally joined (waiting for other side)
  useEffect(() => {
    if (joined && !remoteJoined) {
      setStatus("waiting");
    }
  }, [joined, remoteJoined]);

  function formatTime(s) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  async function handleEnd() {
    if (ending) return;
    setEnding(true);
    setStatus("ending");
    clearInterval(timerRef.current);
    try {
      await leaveCall();
      await fetch("/api/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: callData.callId }),
      });
    } catch (e) {
      console.error(e);
    }
    onEnd();
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

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "linear-gradient(180deg, #0f172a 0%, #1a1a2e 50%, #16213e 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      padding: "60px 32px 48px",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Status */}
      <p style={{ color: statusColor, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", margin: 0 }}>
        {statusText}
      </p>

      {/* Center */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

        {/* Avatar */}
        <div style={{ position: "relative", width: 140, height: 140 }}>
          {joined && (
            <>
              <div style={{
                position: "absolute", inset: -20, borderRadius: "50%",
                background: "rgba(52,211,153,0.1)",
                animation: "pulse1 2s ease-in-out infinite",
              }} />
              <div style={{
                position: "absolute", inset: -10, borderRadius: "50%",
                background: "rgba(52,211,153,0.15)",
                animation: "pulse1 2s ease-in-out infinite",
                animationDelay: "0.5s",
              }} />
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

        {/* Name */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 600, margin: 0 }}>{name}</p>
          {speciality && <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{speciality}</p>}
        </div>

        {/* Timer */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 999, padding: "8px 24px",
        }}>
          <p style={{
            color: remoteJoined ? "#f1f5f9" : "#475569",
            fontSize: 22, fontFamily: "monospace", letterSpacing: 4, margin: 0,
          }}>
            {remoteJoined ? formatTime(duration) : "--:--"}
          </p>
        </div>

        {/* Sound bars */}
        {remoteJoined && !muted && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 32 }}>
            {[0.3, 0.6, 1, 0.7, 0.4, 0.8, 0.5, 1, 0.6, 0.3].map((h, i) => (
              <div key={i} style={{
                width: 4, borderRadius: 4, background: "#34d399",
                height: `${h * 100}%`,
                animation: "bar 1s ease-in-out infinite alternate",
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        )}

        {muted && <p style={{ color: "#ef4444", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>🔇 Muted</p>}
        {error && <p style={{ color: "#ef4444", fontSize: 13 }}>⚠️ {error}</p>}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 40 }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button onClick={toggleMute} style={{
            width: 64, height: 64, borderRadius: "50%",
            border: muted ? "2px solid #ef4444" : "2px solid rgba(255,255,255,0.15)",
            background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 24,
          }}>
            {muted ? "🔇" : "🎙️"}
          </button>
          <span style={{ color: "#64748b", fontSize: 12 }}>{muted ? "Unmute" : "Mute"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button onClick={handleEnd} disabled={ending} style={{
            width: 80, height: 80, borderRadius: "50%", border: "none",
            background: ending ? "#7f1d1d" : "#ef4444",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: ending ? "not-allowed" : "pointer", fontSize: 32,
            boxShadow: "0 8px 32px rgba(239,68,68,0.4)",
            transform: "rotate(135deg)",
          }}>
            📞
          </button>
          <span style={{ color: "#64748b", fontSize: 12 }}>{ending ? "Ending..." : "End Call"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button style={{
            width: 64, height: 64, borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 24,
          }}>🔊</button>
          <span style={{ color: "#64748b", fontSize: 12 }}>Speaker</span>
        </div>

      </div>

      <style>{`
        @keyframes pulse1 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.2; }
        }
        @keyframes bar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
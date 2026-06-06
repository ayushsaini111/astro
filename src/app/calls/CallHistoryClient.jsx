"use client";
import { useRouter } from "next/navigation";

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0s";
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function CallHistoryClient({ calls }) {
  const router = useRouter();

  const totalSeconds = calls.reduce((sum, c) => sum + (c.duration ?? 0), 0);
  const totalCalls = calls.length;
  const freeCalls = calls.filter(c => c.isFreeCall).length;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, marginBottom: 12, padding: 0 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Call History</h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Calls", value: totalCalls },
          { label: "Total Talk Time", value: formatDuration(totalSeconds) },
          { label: "Free Calls", value: freeCalls },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#341539" }}>{stat.value}</p>
            <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {calls.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📞</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No calls yet</p>
          <p style={{ fontSize: 14, marginBottom: 20 }}>Your completed calls will appear here</p>
          <button onClick={() => router.push("/consult")} style={{ background: "#341539", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}>
            Talk to an Expert
          </button>
        </div>
      )}

      {/* Call list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {calls.map((call) => (
          <div key={call.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>

            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #341539, #6b21a8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "white", overflow: "hidden",
            }}>
              {call.pandit.profilePic
                ? <img src={call.pandit.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : call.pandit.name.slice(0, 2).toUpperCase()
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <p style={{ fontWeight: 600, fontSize: 15, margin: 0, color: "#111827" }}>{call.pandit.name}</p>
                <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                  {formatDate(call.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 6px" }}>{call.pandit.speciality}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#374151" }}>
                  🕐 {formatTime(call.startTime)}
                </span>
                <span style={{ fontSize: 12, color: "#374151" }}>
                  ⏱ {formatDuration(call.duration)}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                  background: call.isFreeCall ? "#f0fdf4" : "#fef3f2",
                  color: call.isFreeCall ? "#16a34a" : "#dc2626",
                }}>
                  {call.isFreeCall ? "Free" : `${formatDuration(call.billableSeconds ?? 0)} billed`}
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {calls.length >= 50 && (
        <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 16 }}>
          Showing last 50 calls
        </p>
      )}
    </div>
  );
}
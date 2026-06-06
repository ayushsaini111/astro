"use client";

import { useEffect, useMemo, useState } from "react";

// ─── helpers ────────────────────────────────────────────────
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function resolveUsername(call) {
  return call.user?.username || call.deletedUsername || "Deleted User";
}

function getEndedByName(call) {
  if (!call.endedBy) return "Unknown";
  if (call.endedBy === "USER") return resolveUsername(call);
  if (call.endedBy === "PANDIT") return "You";
  if (call.endedBy === "SYSTEM") return "System";
  if (call.userId && call.endedBy === call.userId) return resolveUsername(call);
  if (call.endedBy === call.panditId) return "You";
  return call.endedBy;
}

function statusStyle(status) {
  switch (status) {
    case "COMPLETED": return { bg: "#f0fdf4", color: "#16a34a" };
    case "ONGOING":   return { bg: "#eff6ff", color: "#2563eb" };
    case "FAILED":    return { bg: "#fff1f2", color: "#e11d48" };
    case "RINGING":   return { bg: "#fefce8", color: "#ca8a04" };
    default:          return { bg: "#f5f5f5", color: "#6b7280" };
  }
}

// ─── main ────────────────────────────────────────────────────
export default function PanditDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // "users" | "recent"

  useEffect(() => {
    fetch("/api/pandit/dashboard")
      .then((r) => r.json())
      .then((result) => setData(result))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── unique users including deleted ──────────────────────────
  const uniqueUsers = useMemo(() => {
    if (!data?.calls) return [];
    const map = new Map();

    data.calls.forEach((call) => {
      const key = call.userId || `deleted_${call.deletedUsername || "unknown"}`;
      const displayName = resolveUsername(call);
      const isDeleted = !call.user;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          displayName,
          isDeleted,
          user: call.user,
          totalCalls: 0,
          completedCalls: 0,
          totalDuration: 0,
          calls: [],
        });
      }

      const entry = map.get(key);
      entry.totalCalls += 1;
      entry.totalDuration += call.duration || 0;
      if (call.status === "COMPLETED") entry.completedCalls += 1;
      entry.calls.push(call);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalDuration - a.totalDuration
    );
  }, [data]);

  // ── aggregate stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    if (!data?.calls) return null;
    const allCalls = data.calls;
    const completed = allCalls.filter((c) => c.status === "COMPLETED");
    const totalSec = allCalls.reduce((s, c) => s + (c.duration || 0), 0);
    return {
      totalCalls: allCalls.length,
      completedCalls: completed.length,
      totalMinutes: Math.floor(totalSec / 60),
      totalSeconds: totalSec % 60,
      uniqueUserCount: uniqueUsers.length,
    };
  }, [data, uniqueUsers]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui, sans-serif", color: "#6b7280",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, border: "3px solid #e5e7eb",
            borderTop: "3px solid #341539", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{
      minHeight: "100vh", background: "#f8f7f9",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "24px 16px 80px",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ color: "#6b7280", marginTop: 4, fontSize: 14 }}>
            Your call analytics & user history
          </p>
        </div>

        {/* ── LIVE STATS ROW ──────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12, marginBottom: 12,
        }}>
          <LiveStatCard
            label="Pending"
            value={data.pendingRequests}
            accent="#f59e0b"
            icon="⏳"
          />
          <LiveStatCard
            label="Ongoing"
            value={data.ongoingCalls}
            accent="#3b82f6"
            icon="📞"
            pulse={data.ongoingCalls > 0}
          />
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12, marginBottom: 24,
        }}>
          <LiveStatCard
            label="Today's Calls"
            value={data.todayCalls}
            accent="#8b5cf6"
            icon="📅"
          />
          <LiveStatCard
            label="Minutes Today"
            value={`${data.totalMinutesToday}m`}
            accent="#10b981"
            icon="⏱"
          />
        </div>

        {/* ── ALL-TIME STATS ───────────────────────────────────── */}
        {stats && (
          <div style={{
            background: "#1a1a2e", borderRadius: 20,
            padding: "20px 24px", marginBottom: 24,
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
          }}>
            <AllTimeStatItem
              label="Total Calls"
              value={stats.totalCalls}
            />
            <AllTimeStatItem
              label="Completed"
              value={stats.completedCalls}
            />
            <AllTimeStatItem
              label="Total Time"
              value={`${stats.totalMinutes}m ${stats.totalSeconds}s`}
            />
          </div>
        )}

        {/* ── TABS ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 16,
        }}>
          {[
            { key: "users", label: `Users (${uniqueUsers.length})` },
            { key: "recent", label: "Recent Calls" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 20px", borderRadius: 100,
                border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 14,
                background: activeTab === tab.key ? "#1a1a2e" : "white",
                color: activeTab === tab.key ? "white" : "#6b7280",
                transition: "all 0.15s",
                boxShadow: activeTab === tab.key ? "none" : "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div style={{
            background: "white", borderRadius: 24,
            border: "1px solid #e5e7eb", overflow: "hidden",
          }}>
            {uniqueUsers.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
                No users handled yet
              </div>
            ) : (
              uniqueUsers.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedUser(item)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "16px 20px", background: "white",
                    border: "none", borderBottom: i < uniqueUsers.length - 1
                      ? "1px solid #f3f4f6" : "none",
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* avatar */}
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: item.isDeleted
                          ? "linear-gradient(135deg, #e5e7eb, #d1d5db)"
                          : "linear-gradient(135deg, #341539, #6b21a8)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 700, fontSize: 16, flexShrink: 0,
                        overflow: "hidden",
                      }}>
                        {item.user?.profilePic
                          ? <img src={item.user.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : item.displayName.slice(0, 1).toUpperCase()
                        }
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>
                            {item.displayName}
                          </span>
                          {item.isDeleted && (
                            <span style={{
                              fontSize: 10, padding: "2px 7px", borderRadius: 100,
                              background: "#fef2f2", color: "#ef4444",
                              border: "1px solid #fecaca", fontWeight: 600,
                            }}>
                              DELETED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                          {item.totalCalls} calls · {item.completedCalls} completed
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
                        {formatDuration(item.totalDuration)}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                        total talk
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* ── RECENT CALLS TAB ────────────────────────────────── */}
        {activeTab === "recent" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.recentCalls.map((call) => (
              <CallCard key={call.id} call={call} />
            ))}
            {data.recentCalls.length === 0 && (
              <div style={{
                background: "white", borderRadius: 20,
                border: "1px solid #e5e7eb",
                padding: 60, textAlign: "center", color: "#9ca3af",
              }}>
                No recent calls
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── USER HISTORY MODAL ──────────────────────────────────── */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            padding: "0 0 0 0",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", width: "100%", maxWidth: 640,
              borderRadius: "24px 24px 0 0",
              maxHeight: "88vh", overflowY: "auto",
              padding: "24px 20px 40px",
            }}
          >
            {/* drag handle */}
            <div style={{
              width: 36, height: 4, background: "#e5e7eb",
              borderRadius: 100, margin: "0 auto 20px",
            }} />

            {/* modal header */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: selectedUser.isDeleted
                    ? "linear-gradient(135deg, #e5e7eb, #d1d5db)"
                    : "linear-gradient(135deg, #341539, #6b21a8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: 20, overflow: "hidden",
                }}>
                  {selectedUser.user?.profilePic
                    ? <img src={selectedUser.user.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : selectedUser.displayName.slice(0, 1).toUpperCase()
                  }
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                      {selectedUser.displayName}
                    </h2>
                    {selectedUser.isDeleted && (
                      <span style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 100,
                        background: "#fef2f2", color: "#ef4444",
                        border: "1px solid #fecaca", fontWeight: 600,
                      }}>DELETED</span>
                    )}
                  </div>
                  <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                    {selectedUser.totalCalls} calls · {formatDuration(selectedUser.totalDuration)} total
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "#f3f4f6", border: "none",
                  cursor: "pointer", fontSize: 18, color: "#6b7280",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>

            {/* modal stats */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10, marginBottom: 20,
            }}>
              {[
                { label: "Total", value: selectedUser.totalCalls },
                { label: "Completed", value: selectedUser.completedCalls },
                { label: "Talk Time", value: formatDuration(selectedUser.totalDuration) },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "#f8f7f9", borderRadius: 14,
                  padding: "12px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* call list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedUser.calls.map((call) => (
                <CallCard key={call.id} call={call} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────

function LiveStatCard({ label, value, accent, icon, pulse }) {
  return (
    <div style={{
      background: "white", borderRadius: 20,
      border: "1px solid #e5e7eb", padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: accent + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, position: "relative", flexShrink: 0,
      }}>
        {icon}
        {pulse && (
          <span style={{
            position: "absolute", top: 6, right: 6,
            width: 8, height: 8, borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 0 2px white",
            animation: "ping 1.5s ease-in-out infinite",
          }} />
        )}
        <style>{`@keyframes ping{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function AllTimeStatItem({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
    </div>
  );
}

function CallCard({ call }) {
  const duration = call.duration || 0;
  const { bg, color } = statusStyle(call.status);
  const username = resolveUsername(call);

  return (
    <div style={{
      background: "white", borderRadius: 18,
      border: "1px solid #e5e7eb", padding: "14px 16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>
              {username}
            </span>
            {!call.user && (
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 100,
                background: "#fef2f2", color: "#ef4444",
                border: "1px solid #fecaca", fontWeight: 600,
              }}>DELETED</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>
            {new Date(call.createdAt).toLocaleString("en-IN")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span style={{
              fontSize: 11, padding: "3px 9px", borderRadius: 100,
              background: bg, color, fontWeight: 600,
            }}>
              {call.status}
            </span>
            <span style={{
              fontSize: 11, padding: "3px 9px", borderRadius: 100,
              background: "#f3f4f6", color: "#6b7280",
            }}>
              {call.billingType}
            </span>
            <span style={{
              fontSize: 11, padding: "3px 9px", borderRadius: 100,
              background: "#f3f4f6", color: "#6b7280",
            }}>
              Ended: {getEndedByName(call)}
            </span>
            {call.isFreeCall && (
              <span style={{
                fontSize: 11, padding: "3px 9px", borderRadius: 100,
                background: "#fffbeb", color: "#d97706",
                border: "1px solid #fde68a",
              }}>Free</span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            {formatDuration(duration)}
          </div>
          {call.totalCost > 0 && (
            <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>
              ₹{call.totalCost.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import RequestsHeader from "@/components/Pandits/Header";

function resolveUsername(call) {
  return call.user?.username || call.deletedUsername || "Deleted User";
}

function isMissedCall(call) {
  // Accurate missed call: FAILED + never started
  return call.status === "FAILED" && !call.startTime;
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

export default function PanditDashboardPage() {
  const [data, setData] = useState(null);
  const [panditData, setPanditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, profileRes] = await Promise.all([
          fetch("/api/pandit/dashboard"),
          fetch("/api/pandit/profile"),
        ]);

        const dashboardData = await dashboardRes.json();
        const profileData = await profileRes.json();

        setData(dashboardData);
        setPanditData(profileData);
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Today's calls
  const todayCalls = useMemo(() => {
    if (!data?.calls) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.calls
      .filter((call) => {
        const callDate = new Date(call.createdAt);
        callDate.setHours(0, 0, 0, 0);
        return callDate.getTime() === today.getTime();
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [data]);

  // Recent pending requests
  const recentRequests = useMemo(() => {
    if (!data?.calls) return [];
    return data.calls
      .filter((c) => ["INITIATED", "RINGING"].includes(c.status))
      .slice(0, 3);
  }, [data]);

  // Today's accurate stats with details
  const todayStats = useMemo(() => {
    if (!todayCalls.length) return null;

    const completed = todayCalls.filter((c) => c.status === "COMPLETED");
    const missedCalls = todayCalls.filter((c) => isMissedCall(c));
    const totalSec = todayCalls.reduce((s, c) => s + (c.duration || 0), 0);

    // Get first call (by createdAt)
    const firstCall = todayCalls[0];

    // Get last completed call
    const lastCompletedCall = [...completed].reverse()[0];

    // Get first missed call
    const firstMissedCall = missedCalls[0];

    // Get last call (by createdAt)
    const lastCall = todayCalls[todayCalls.length - 1];

    return {
      totalCalls: todayCalls.length,
      completedCalls: completed.length,
      missedCalls: missedCalls.length,
      totalMinutes: Math.floor(totalSec / 60),
      totalSeconds: totalSec % 60,
      firstCall,
      lastCompletedCall,
      firstMissedCall,
      lastCall,
    };
  }, [todayCalls]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#6b7280"
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
      fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: 80
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingTop: 24 }}>
          <RequestsHeader
            heading="Dashboard"
            subheading="Talk to verified expert"
            panditData={panditData}
            showProfileOnMobile={true}
          />
        </div>

        {/* Recent Requests */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 12
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>
              Recent Requests
            </h3>
            <a href="/pandit/requests" style={{
              fontSize: 11, fontWeight: 600, color: "#341539",
              textDecoration: "none", padding: "4px 8px", borderRadius: 6
            }}>
              View All →
            </a>
          </div>

          {recentRequests.length > 0 ? (
            <div style={{
              background: "white", borderRadius: 20,
              border: "1px solid #e5e7eb", overflow: "hidden"
            }}>
              {recentRequests.map((call, i) => (
                <div key={call.id} style={{
                  padding: "14px 16px",
                  borderBottom: i < recentRequests.length - 1 ? "1px solid #f3f4f6" : "none",
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#111827", margin: 0 }}>
                      {resolveUsername(call)}
                    </p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: "3px 0 0 0" }}>
                      {new Date(call.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, padding: "5px 11px", borderRadius: 8,
                    background: "#fef3c7", color: "#92400e", fontWeight: 600
                  }}>
                    Pending
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: "white", borderRadius: 20, border: "1px solid #e5e7eb",
              padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 14
            }}>
              No pending requests
            </div>
          )}
        </div>

        {/* Today's Overview */}
        {todayStats && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 12px 0"
            }}>
              Today's Overview
            </h3>

            <div style={{
              background: "white", borderRadius: 20,
              border: "1px solid #e5e7eb", padding: "24px"
            }}>
              <div style={{ position: "relative" }}>
                {/* Timeline Line */}
                <div style={{
                  position: "absolute", left: 20, top: 0, bottom: 0,
                  width: 2, background: "linear-gradient(180deg, #341539, #e5e7eb)"
                }} />

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* First Call */}
                  {todayStats.firstCall && (
                    <TimelineItem
                      icon="🕐"
                      label="First Call"
                      value={new Date(todayStats.firstCall.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                      subtitle={resolveUsername(todayStats.firstCall)}
                      color="#f59e0b"
                    />
                  )}

                  {/* Missed Calls */}
                  {todayStats.missedCalls > 0 && todayStats.firstMissedCall && (
                    <TimelineItem
                      icon="✕"
                      label={`Missed Call${todayStats.missedCalls > 1 ? 's' : ''}`}
                      value={todayStats.missedCalls}
                      subtitle={`First at ${new Date(todayStats.firstMissedCall.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit"
                      })} - ${resolveUsername(todayStats.firstMissedCall)}`}
                      color="#ef4444"
                    />
                  )}

                  {/* Completed Calls */}
                  {todayStats.completedCalls > 0 && (
                    <TimelineItem
                      icon="✓"
                      label="Completed Calls"
                      value={todayStats.completedCalls}
                      color="#10b981"
                    />
                  )}

                  {/* Last Call */}
                  {todayStats.lastCall && (
                    <TimelineItem
                      icon="🕑"
                      label="Last Call"
                      value={new Date(todayStats.lastCall.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                      subtitle={resolveUsername(todayStats.lastCall)}
                      color="#8b5cf6"
                    />
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today's Activity Summary */}
        {todayCalls.length > 0 && todayStats && (
          <div>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 12px 0"
            }}>
              Today's Activity
            </h3>

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10, marginBottom: 16
            }}>
              <StatBox 
                label="Total Calls" 
                value={todayStats.totalCalls} 
                icon="📞" 
                color="#3b82f6" 
              />
              <StatBox 
                label="Talk Time" 
                value={`${todayStats.totalMinutes}m ${todayStats.totalSeconds}s`} 
                icon="⏱" 
                color="#10b981" 
              />
              <StatBox 
                label="Missed" 
                value={todayStats.missedCalls} 
                icon="✕" 
                color="#ef4444" 
              />
            </div>
          </div>
        )}

        {todayCalls.length === 0 && (
          <div style={{
            background: "white", borderRadius: 20, border: "1px solid #e5e7eb",
            padding: 60, textAlign: "center", color: "#9ca3af"
          }}>
            <p style={{ fontSize: 14, margin: 0 }}>No calls today yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub Components ───────────────────────────────────────

function TimelineItem({ icon, label, value, subtitle, color }) {
  return (
    <div style={{ display: "flex", gap: 16, position: "relative", zIndex: 1 }}>
      {/* Timeline Dot */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: color + "18", border: `2px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, flexShrink: 0, position: "relative", zIndex: 2
      }}>
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingTop: 4 }}>
        <p style={{
          fontSize: 12, color: "#6b7280", margin: 0,
          fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px"
        }}>
          {label}
        </p>
        <p style={{
          fontSize: 18, fontWeight: 800, color: "#111827", margin: "6px 0 0 0"
        }}>
          {value}
        </p>
        {subtitle && (
          <p style={{
            fontSize: 13, color: "#6b7280", margin: "4px 0 0 0", fontWeight: 500
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }) {
  return (
    <div style={{
      background: "white", border: `1px solid ${color}20`,
      borderRadius: 16, padding: "14px 12px", textAlign: "center"
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0 0", fontWeight: 600 }}>
        {label}
      </p>
    </div>
  );
}
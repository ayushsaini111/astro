"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

function formatSeconds(s) {
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
}

export default function SettingsClient({ user }) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username ?? "");
  const [dob, setDob] = useState(user.dob ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, dob }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage("Profile updated successfully!");
    } else {
      setMessage(data.error ?? "Failed to update");
    }
  }

async function handleDelete() {
  if (deleteInput !== "DELETE") return;
  setDeleting(true);
  try {
    const res = await fetch("/api/user/delete", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      // Sign out NextAuth session then hard redirect
      await signOut({ redirect: false });
      // Force full page reload to clear all state
      window.location.href = "/";
    } else {
      setMessage(data.error ?? "Failed to delete account");
      setDeleting(false);
    }
  } catch (e) {
    setMessage("Something went wrong");
    setDeleting(false);
  }
}
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div style={{
      maxWidth: 520, margin: "0 auto", padding: "32px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      <div style={{ marginBottom: 32 }}>
        <button onClick={() => router.back()} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#64748b", fontSize: 14, marginBottom: 16, padding: 0,
        }}>
          Back
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Settings</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
          Member since {joinDate}
        </p>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg, #341539, #6b21a8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, color: "white",
          overflow: "hidden", flexShrink: 0,
        }}>
          {user.profilePic
            ? <img src={user.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (user.username ?? "U").slice(0, 1).toUpperCase()
          }
        </div>
        <div>
          <p style={{ fontWeight: 600, fontSize: 18, margin: 0 }}>{user.username ?? "—"}</p>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>
            {user.phone ?? user.email ?? "—"}
          </p>
        </div>
      </div>

      {/* Active Plan */}
      <div style={{
        background: user.activePlan ? "#f0fdf4" : "#fef9f0",
        border: `1px solid ${user.activePlan ? "#bbf7d0" : "#fed7aa"}`,
        borderRadius: 12, padding: 16, marginBottom: 28,
      }}>
        {user.activePlan ? (
          <>
            <p style={{ fontWeight: 600, color: "#16a34a", marginBottom: 4 }}>
              Active Plan: {user.activePlan.name}
            </p>
            <p style={{ color: "#15803d", fontSize: 13 }}>
              {formatSeconds(user.activePlan.remainingSeconds)} remaining · Expires {new Date(user.activePlan.endDate).toLocaleDateString("en-IN")}
            </p>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "#ea580c", fontWeight: 600, margin: 0 }}>No active plan</p>
            <button onClick={() => router.push("/plans")} style={{
              background: "#341539", color: "white", border: "none",
              borderRadius: 8, padding: "8px 16px", fontSize: 13,
              fontWeight: 600, cursor: "pointer",
            }}>Buy Plan</button>
          </div>
        )}
      </div>
      <button onClick={() => router.push("/calls")} style={{
  width: "100%", padding: "12px 0", marginBottom: 10,
  background: "white", color: "#374151",
  border: "1px solid #d1d5db", borderRadius: 10,
  fontWeight: 600, fontSize: 15, cursor: "pointer",
}}>
  📞 Call History
</button>

      {/* Edit Profile */}
      <div style={{
        background: "white", border: "1px solid #e5e7eb",
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>
          Edit Profile
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1px solid #d1d5db", fontSize: 14,
              boxSizing: "border-box", outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1px solid #d1d5db", fontSize: 14,
              boxSizing: "border-box", outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Phone / Email
          </label>
          <input
            value={user.phone ?? user.email ?? ""}
            disabled
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1px solid #e5e7eb", fontSize: 14,
              background: "#f9fafb", color: "#9ca3af",
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Cannot be changed</p>
        </div>

        {message && (
          <div style={{
            padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16,
            background: message.startsWith("Profile updated") ? "#f0fdf4" : "#fef2f2",
            color: message.startsWith("Profile updated") ? "#16a34a" : "#dc2626",
          }}>
            {message}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: "100%", padding: "12px 0",
          background: saving ? "#9ca3af" : "#341539",
          color: "white", border: "none", borderRadius: 10,
          fontWeight: 600, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
        }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Sign Out */}
      <div style={{
        background: "white", border: "1px solid #e5e7eb",
        borderRadius: 16, padding: 24, marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>Account</h2>
        <button onClick={() => signOut({ callbackUrl: "/" })} style={{
          width: "100%", padding: "12px 0",
          background: "white", color: "#374151",
          border: "1px solid #d1d5db", borderRadius: 10,
          fontWeight: 600, fontSize: 15, cursor: "pointer",
        }}>
          Sign Out
        </button>
      </div>

      {/* Delete Account */}
      <div style={{
        background: "#fff5f5", border: "1px solid #fecaca",
        borderRadius: 16, padding: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", marginBottom: 8, marginTop: 0 }}>
          Danger Zone
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Deleting your account is permanent. All your data, plans, and call history will be removed.
        </p>

        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            width: "100%", padding: "12px 0",
            background: "white", color: "#dc2626",
            border: "1px solid #fca5a5", borderRadius: 10,
            fontWeight: 600, fontSize: 15, cursor: "pointer",
          }}>
            Delete Account
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>
              Type DELETE to confirm:
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #fca5a5", fontSize: 14,
                boxSizing: "border-box", marginBottom: 12, outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }} style={{
                flex: 1, padding: "11px 0",
                background: "white", color: "#374151",
                border: "1px solid #d1d5db", borderRadius: 10,
                fontWeight: 600, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteInput !== "DELETE" || deleting}
                style={{
                  flex: 1, padding: "11px 0",
                  background: deleteInput === "DELETE" ? "#dc2626" : "#fca5a5",
                  color: "white", border: "none", borderRadius: 10,
                  fontWeight: 600,
                  cursor: deleteInput === "DELETE" ? "pointer" : "not-allowed",
                }}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
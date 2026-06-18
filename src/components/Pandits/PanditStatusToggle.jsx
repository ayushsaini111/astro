"use client";
import { useState } from "react";

export default function PanditStatusToggle({ panditId, initialStatus = false }) {
  const [isAvailable, setIsAvailable] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/pandit/toggle-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panditId, isAvailable: !isAvailable }),
      });

      if (res.ok) {
        setIsAvailable(!isAvailable);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          isAvailable ? "bg-green-500" : "bg-gray-300"
        } disabled:opacity-50`}
        aria-label="Toggle availability"
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            isAvailable ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className={`text-xs font-medium ${isAvailable ? "text-green-600" : "text-gray-500"}`}>
        {isAvailable ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
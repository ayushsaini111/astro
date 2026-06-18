// app/pandit/profile/manage/availability/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Power } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");
  const [breakTime, setBreakTime] = useState("13:00");
  const [workingDays, setWorkingDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ✅ Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/pandit/profile");
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        console.log("📥 Profile data:", data);

        setIsAvailable(data.isAvailable ?? false);
        setStartTime(data.startTime || "09:00");
        setEndTime(data.endTime || "21:00");
        setBreakTime(data.breakTime || "13:00");
        setWorkingDays(data.workingDays || []);
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleToggleAvailability = async (newStatus) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/pandit/profile/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newStatus }),
      });

      if (res.ok) {
        setIsAvailable(newStatus);
        setSuccess("Availability updated");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update");
      }
    } catch (err) {
      setError("Error updating availability");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async () => {
    setError(null);

    if (!startTime || !endTime) {
      setError("Please set working hours");
      return;
    }

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (endTotalMin <= startTotalMin) {
      setError("End time must be after start time");
      return;
    }

    if (workingDays.length === 0) {
      setError("Please select at least one working day");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/pandit/profile/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime,
          endTime,
          breakTime,
          workingDays,
        }),
      });

      if (res.ok) {
        setSuccess("Hours updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update hours");
      }
    } catch (err) {
      setError("Error saving hours");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-main border-t-secondary-dark rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background px-[var(--S16)] py-[var(--S24)] flex items-center gap-[var(--S16)] border-b border-secondary-main">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary-main transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-main" />
        </button>
        <h1 className="heading-h5 text-main">Availability</h1>
      </header>

      {/* Content */}
      <main className="px-[var(--S16)] py-[var(--S24)] max-w-2xl mx-auto pb-24">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-main/10 border border-red-main rounded-[var(--R16)] p-[var(--S16)] mb-[var(--S24)] text-red-main text-sm">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-main/10 border border-green-main rounded-[var(--R16)] p-[var(--S16)] mb-[var(--S24)] text-green-main text-sm">
            ✅ {success}
          </div>
        )}

        {/* Availability Toggle */}
        <section className="mb-[var(--S32)]">
          <div className="bg-white rounded-[var(--R24)] shadow-sm border border-secondary-main p-[var(--S16)] flex items-center justify-between">
            <div className="flex items-center gap-[var(--S12)]">
              <div className="w-10 h-10 rounded-[var(--R16)] bg-secondary-main flex items-center justify-center">
                <Power className="w-5 h-5 text-primary-main" />
              </div>
              <div>
                <p className="text-sm font-medium text-main">Availability Status</p>
                <p className="text-xs text-secondary mt-[var(--S4)]">
                  {isAvailable ? "✅ You are available" : "⏱️ You are offline"}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleAvailability(!isAvailable)}
              disabled={saving}
              className={`relative w-14 h-8 rounded-full transition-all ${
                isAvailable ? "bg-primary-main" : "bg-secondary-main"
              } disabled:opacity-50`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Working Hours */}
        <section className="mb-[var(--S32)]">
          <h2 className="heading-h6 text-main mb-[var(--S16)]">Working Hours</h2>
          <div className="bg-white rounded-[var(--R24)] shadow-sm border border-secondary-main p-[var(--S16)] space-y-[var(--S16)]">
            <div>
              <label className="text-secondary text-sm font-medium block mb-[var(--S8)]">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-[var(--S12)] py-[var(--S8)] rounded-[var(--R16)] border border-secondary-main bg-background focus:outline-none focus:ring-2 focus:ring-primary-main text-main text-sm"
              />
            </div>

            <div>
              <label className="text-secondary text-sm font-medium block mb-[var(--S8)]">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-[var(--S12)] py-[var(--S8)] rounded-[var(--R16)] border border-secondary-main bg-background focus:outline-none focus:ring-2 focus:ring-primary-main text-main text-sm"
              />
            </div>

            <div>
              <label className="text-secondary text-sm font-medium block mb-[var(--S8)]">
                Break Time
              </label>
              <input
                type="time"
                value={breakTime}
                onChange={(e) => setBreakTime(e.target.value)}
                className="w-full px-[var(--S12)] py-[var(--S8)] rounded-[var(--R16)] border border-secondary-main bg-background focus:outline-none focus:ring-2 focus:ring-primary-main text-main text-sm"
              />
            </div>
          </div>
        </section>

        {/* Working Days */}
        <section className="mb-[var(--S32)]">
          <h2 className="heading-h6 text-main mb-[var(--S16)]">Working Days</h2>
          <div className="bg-white rounded-[var(--R24)] shadow-sm border border-secondary-main p-[var(--S16)]">
            <div className="flex gap-[var(--S8)] flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  disabled={saving || (workingDays.includes(day) && workingDays.length === 1)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                    workingDays.includes(day)
                      ? "bg-primary-main text-white"
                      : "bg-secondary-main text-primary-main hover:bg-secondary-dark"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent pt-[var(--S16)] px-[var(--S16)] pb-[var(--S24)]">
          <button
            onClick={handleSaveHours}
            disabled={saving}
            className="w-full py-[var(--S12)] rounded-full bg-primary-main text-white font-medium text-sm hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
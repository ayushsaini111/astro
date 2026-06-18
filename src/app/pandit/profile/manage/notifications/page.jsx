// app/pandit/profile/manage/notifications/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Mail, Clock, Gift } from "lucide-react";

const NOTIFICATION_TYPES = [
  {
    key: "consultationRequests",
    label: "Consultation Requests",
    desc: "Get notified when users request consultations",
    icon: Bell,
  },
  {
    key: "messages",
    label: "Messages",
    desc: "Get notified when you receive new messages",
    icon: Mail,
  },
  {
    key: "reminders",
    label: "Reminders",
    desc: "Get reminders for upcoming consultations",
    icon: Clock,
  },
  {
    key: "promotions",
    label: "Promotions",
    desc: "Get updates about new features and offers",
    icon: Gift,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    consultationRequests: true,
    messages: true,
    reminders: true,
    promotions: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/pandit/profile");
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        console.log("📥 Notifications data:", data);

        setNotifications({
          consultationRequests: data.notificationsConsultationRequests ?? true,
          messages: data.notificationsMessages ?? true,
          reminders: data.notificationsReminders ?? true,
          promotions: data.notificationsPromotions ?? false,
        });
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggle = async (key) => {
    const oldValue = notifications[key];
    const newValue = !oldValue;
    setNotifications({ ...notifications, [key]: newValue });

    setSaving(true);
    try {
      const res = await fetch("/api/pandit/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });

      if (!res.ok) {
        setNotifications({ ...notifications, [key]: oldValue });
        setError("Failed to update setting");
      } else {
        setError(null);
      }
    } catch (err) {
      setNotifications({ ...notifications, [key]: oldValue });
      setError("Error updating setting");
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
        <h1 className="heading-h5 text-main">Notifications</h1>
      </header>

      {/* Content */}
      <main className="px-[var(--S16)] py-[var(--S24)] max-w-2xl mx-auto pb-24">
        {error && (
          <div className="bg-red-main/10 border border-red-main rounded-[var(--R16)] p-[var(--S16)] mb-[var(--S24)] text-red-main text-sm">
            {error}
          </div>
        )}

        <section className="mb-[var(--S24)]">
          <h2 className="heading-h6 text-main mb-[var(--S16)]">Notification Settings</h2>
          <div className="bg-white rounded-[var(--R24)] shadow-sm border border-secondary-main overflow-hidden">
            {NOTIFICATION_TYPES.map((notif, index) => {
              const Icon = notif.icon;
              const isEnabled = notifications[notif.key] !== false;

              return (
                <div
                  key={notif.key}
                  className={`flex items-center justify-between p-[var(--S16)] ${
                    index < NOTIFICATION_TYPES.length - 1
                      ? "border-b border-secondary-main"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-[var(--S12)] flex-1">
                    <div className="w-10 h-10 rounded-[var(--R16)] bg-secondary-main flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-main" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-main">{notif.label}</p>
                      <p className="text-xs text-secondary mt-[var(--S4)]">{notif.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(notif.key)}
                    disabled={saving}
                    className={`relative w-14 h-8 rounded-full transition-all ml-[var(--S12)] flex-shrink-0 ${
                      isEnabled ? "bg-primary-main" : "bg-secondary-main"
                    } disabled:opacity-50`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                        isEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <div className="bg-secondary-main rounded-[var(--R16)] p-[var(--S16)]">
          <p className="text-xs text-secondary leading-relaxed">
            Changes are saved automatically. You can manage these preferences anytime.
          </p>
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Phone,
  Package,
  CalendarHeart,
  ChevronRight,
  Star,
  Clock,
  Gift,
  X,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/PageHeader";

function WelcomePopup({ isOpen, onClose, userName, onStartConsultation }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full">
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 px-6 py-8 text-center">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Gift size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome, {userName}! 🎉</h2>
            <p className="text-white/90 text-sm">Your spiritual journey begins here</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Free Consultation Awaits!</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Get started with a <span className="font-bold text-purple-600">free test call</span> with our certified pandits.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { icon: "🔮", text: "Personalized guidance" },
              { icon: "🕉️", text: "Certified pandits" },
              { icon: "⏰", text: "Available 24/7" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{b.icon}</span>
                <span className="text-gray-700">{b.text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onStartConsultation}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition-opacity"
          >
            Start Free Consultation
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 animate-[shrink_5s_linear]" />
      </div>
    </div>
  );
}

function formatSeconds(s) {
  if (!s || s <= 0) return "0m";
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  }
  return `${s}s`;
}

function TalktimeWidget({ userId }) {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/plans/status")
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [userId]);

  if (!data) return null;

  const totalRemaining = data.activePlans?.reduce((a, p) => a + p.remainingSeconds, 0) ?? 0;
  const hasPlan = data.activePlans?.length > 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  // Use first active plan for ring
  const firstPlan = data.activePlans?.[0];
  const ringPercent = firstPlan
    ? Math.min((firstPlan.remainingSeconds / (firstPlan.remainingSeconds + 60)) * 100, 100)
    : 0;
  const offset = circ * (1 - ringPercent / 100);

  return (
    <div
      onClick={() => router.push("/plans")}
      className="cursor-pointer bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl px-5 py-4 flex items-center gap-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 max-w-[300px]"
    >
      {/* Mini ring */}
      <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
        <svg className="-rotate-90 absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#F3EAF5" strokeWidth="6" />
          <circle cx="32" cy="32" r={r} fill="none" stroke="#9B59B6" strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={hasPlan ? offset : circ}
            strokeLinecap="round" />
        </svg>
        <div className="z-10 flex flex-col items-center">
          {data.hasFreeCall && !hasPlan ? (
            <Gift size={16} className="text-[#9B59B6]" />
          ) : (
            <Zap size={16} className="text-[#9B59B6]" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {data.hasFreeCall && !hasPlan ? (
          <>
            <p className="text-sm font-bold text-gray-800">Free call ready!</p>
          </>
        ) : hasPlan ? (
          <>
            <p className="text-xs text-gray-500 mb-0.5">Talktime left</p>
            <p className="text-lg font-black text-gray-900">{formatSeconds(totalRemaining)}</p>
            {firstPlan && (
              <p className="text-[10px] text-gray-400 truncate">
                {firstPlan.name} · expires {new Date(firstPlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-gray-800">No talktime</p>
            <p className="text-xs text-[#9B59B6] font-medium">View plans →</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const user = session?.user;

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    const seen = localStorage.getItem("hasSeenWelcomePopup");
    if (seen) return;
    const created = new Date(user.createdAt || Date.now());
    const hoursDiff = (Date.now() - created.getTime()) / 3600000;
    if (hoursDiff < 24) setTimeout(() => setShowWelcome(true), 1000);
  }, [isLoggedIn, user]);

  function handleCloseWelcome() {
    setShowWelcome(false);
    localStorage.setItem("hasSeenWelcomePopup", "true");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 overflow-x-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-gradient-to-br from-orange-300/20 to-yellow-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <PageHeader />

      {/* HERO */}
      <section className="relative w-full px-6 md:px-16 py-16 md:py-24 flex flex-col md:flex-row items-center gap-16 max-w-7xl mx-auto">

        {/* LEFT */}
        <div className="flex-1 flex flex-col items-start gap-8 z-10">

          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-200/50 backdrop-blur-sm">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🕉️ Vedic Astrology • Certified Experts
            </span>
            <Star size={14} className="text-purple-500" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                Understand your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                life with clarity
              </span>
            </h1>
          </div>

          <p className="text-xl text-gray-600 max-w-xl leading-relaxed">
            Not predictions. Just meaningful insights from
            <span className="font-bold text-gray-800"> certified pandits</span> —
            available whenever you need guidance.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-4 flex-wrap">
            {isLoggedIn ? (
              <button
                onClick={() => router.push(user?.role === "pandit" ? "/pandit" : "/consult")}
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                {user?.role === "pandit" ? "Go to Dashboard" : "Talk to an Expert"}
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  Get Started Free
                  <Gift size={20} className="group-hover:rotate-12 transition-transform" />
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="group px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 text-gray-700 rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  Login
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex justify-center md:justify-end relative z-10">
          <div className="relative group">
            <div className="absolute -inset-6 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 animate-pulse" />
            <div
              className="relative rounded-[2.5rem] overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.2)]"
              style={{ width: "min(450px, 90vw)", height: "min(550px, 70vw)", minHeight: 350 }}
            >
              <Image src="/hero.jpg" alt="Expert pandit" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Live badge */}
              <div className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  Live Now
                </div>
              </div>
            </div>

            {/* ✅ Talktime widget — shows for logged in users */}
            {isLoggedIn && user?.role !== "pandit" && (
              <div className="absolute bottom-8 -left-8">
                <TalktimeWidget userId={user?.id} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="w-full px-6 md:px-16 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Your Spiritual Journey Awaits
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive spiritual services designed for your growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Expert Consultation", desc: "Live guidance from certified pandits", icon: <Phone size={32} />, href: "/consult", gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50", badge: "24/7 Available" },
              { title: "Spiritual Remedies",  desc: "Personalized solutions for life challenges", icon: <Sparkles size={32} />, href: "/remedies", gradient: "from-purple-500 to-pink-500", bg: "from-purple-50 to-pink-50", badge: "Personalized" },
              { title: "Sacred Products",    desc: "Authentic spiritual items and essentials", icon: <Package size={32} />, href: "/allproducts", gradient: "from-emerald-500 to-teal-500", bg: "from-emerald-50 to-teal-50", badge: "Authentic" },
              { title: "Live Ceremonies",    desc: "Book traditional poojas and rituals", icon: <CalendarHeart size={32} />, href: "/ceremonies", gradient: "from-orange-500 to-yellow-500", bg: "from-orange-50 to-yellow-50", badge: "Live Streaming" },
            ].map((item) => (
              <div
                key={item.title}
                onClick={() => router.push(item.href)}
                className={`group relative cursor-pointer bg-gradient-to-br ${item.bg} rounded-3xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-700">
                  {item.badge}
                </div>
                <div className="relative z-10 flex flex-col min-h-[240px]">
                  <div className={`w-20 h-20 bg-gradient-to-r ${item.gradient} rounded-3xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/30 mt-4">
                    <span className={`font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                      Explore Now
                    </span>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WelcomePopup
        isOpen={showWelcome}
        onClose={handleCloseWelcome}
        onStartConsultation={() => { handleCloseWelcome(); router.push("/consult"); }}
        userName={user?.name || user?.username || "Friend"}
      />

      <style jsx>{`
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Phone, Package, CalendarHeart, ChevronRight,
  Gift, X, Sparkles, Zap, Clock, Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/PageHeader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSeconds(s) {
  if (!s || s <= 0) return "0m";
  if (s >= 3600) { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return m > 0 ? `${h}h ${m}m` : `${h}h`; }
  if (s >= 60)   { const m = Math.floor(s / 60),   sec = s % 60;                    return sec > 0 ? `${m}m ${sec}s` : `${m}m`; }
  return `${s}s`;
}

// ─── Free Call Banner (one-time popup) ───────────────────────────────────────
function FreeCallPopup({ onClose, onStart }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="relative w-full max-w-sm bg-white rounded-[28px] overflow-hidden shadow-2xl">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 bg-[#9B59B6] animate-[shrink_6s_linear_forwards]" />

        {/* Purple header */}
        <div className="bg-gradient-to-br from-[#7D3C98] to-[#9B59B6] px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
            <Gift size={30} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">🎉 Welcome Gift!</h2>
          <p className="text-white/80 text-sm mt-1">Your first call is on us</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="bg-[#F9F4FB] rounded-2xl px-4 py-3 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#9B59B6] flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">5-second free call</p>
              <p className="text-xs text-gray-500">Connect with a certified pandit — free</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onStart}
              className="flex-1 py-3 rounded-2xl bg-[#9B59B6] text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Start Free Call →
            </button>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Welcome Popup ─────────────────────────────────────────────────────────
function WelcomePopup({ isOpen, onClose, userName, onStartConsultation }) {
  useEffect(() => {
    if (isOpen) { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full">
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 px-6 py-8 text-center relative">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="w-14 h-14 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
              <Gift size={26} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Welcome, {userName}! 🎉</h2>
            <p className="text-white/80 text-sm mt-1">Your spiritual journey begins here</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {[{ icon: "🔮", text: "Personalized guidance" }, { icon: "🕉️", text: "Certified pandits" }, { icon: "⏰", text: "Available 24/7" }].map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-base">{b.icon}</span>{b.text}
            </div>
          ))}
          <button onClick={onStartConsultation} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity">
            Start Free Consultation
          </button>
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
          <X size={14} />
        </button>
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 animate-[shrink_5s_linear_forwards]" />
      </div>
    </div>
  );
}

// ─── Talktime Card ────────────────────────────────────────────────────────────
function TalktimeCard({ userId }) {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/plans/status").then(r => r.json()).then(setData).catch(() => {});
  }, [userId]);

  if (!data) return null;

  const totalRemaining = data.activePlans?.reduce((a, p) => a + p.remainingSeconds, 0) ?? 0;
  const hasPlan = (data.activePlans?.length ?? 0) > 0;
  const firstPlan = data.activePlans?.[0];

  // ring
  const R = 22, circ = 2 * Math.PI * R;
  const pct = hasPlan ? Math.min(totalRemaining / Math.max(totalRemaining + 300, 600), 1) : 0;
  const dash = circ * (1 - pct);

  return (
    <div
      onClick={() => router.push("/plans")}
      className="cursor-pointer flex items-center gap-3 bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-white/60 hover:scale-105 transition-all duration-300"
    >
      {/* Ring */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r={R} fill="none" stroke="#F3EAF5" strokeWidth="5" />
          <circle cx="26" cy="26" r={R} fill="none" stroke="#9B59B6" strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {data.hasFreeCall && !hasPlan
            ? <Gift size={14} className="text-[#9B59B6]" />
            : <Zap size={14} className="text-[#9B59B6]" />}
        </div>
      </div>

      {/* Text */}
      <div>
        {data.hasFreeCall && !hasPlan ? (
          <>
            <p className="text-xs font-bold text-[#9B59B6]">Free call ready!</p>
            <p className="text-[10px] text-gray-400">Tap to start →</p>
          </>
        ) : hasPlan ? (
          <>
            <p className="text-[10px] text-gray-400">Talktime left</p>
            <p className="text-sm font-black text-gray-900">{formatSeconds(totalRemaining)}</p>
            {firstPlan && (
              <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                exp {new Date(firstPlan.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-gray-700">No talktime</p>
            <p className="text-[10px] text-[#9B59B6]">View plans →</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Free Call Highlight Strip ────────────────────────────────────────────────
function FreeCallStrip({ onClaim }) {
  return (
    <div
      onClick={onClaim}
      className="cursor-pointer flex items-center gap-3 bg-gradient-to-r from-[#7D3C98] to-[#9B59B6] rounded-2xl px-4 py-3 shadow-lg hover:opacity-90 transition-opacity"
    >
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <Gift size={16} className="text-white" />
      </div>
      <div className="flex-1">
        <p className="text-white text-xs font-bold">🎁 Your first call is FREE</p>
        <p className="text-white/70 text-[10px]">5 seconds on us — no card needed</p>
      </div>
      <ChevronRight size={14} className="text-white/80" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showFreePopup, setShowFreePopup] = useState(false);
  const [planData, setPlanData] = useState(null);

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const user = session?.user;
  const isUser = isLoggedIn && user?.role !== "pandit";

  // Welcome popup for new users
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    const seen = localStorage.getItem("hasSeenWelcomePopup");
    if (seen) return;
    const hoursDiff = (Date.now() - new Date(user.createdAt || Date.now()).getTime()) / 3600000;
    if (hoursDiff < 24) setTimeout(() => setShowWelcome(true), 800);
  }, [isLoggedIn, user]);

  // Fetch plan status for free call popup
  useEffect(() => {
    if (!isUser || !user?.id) return;
    fetch("/api/plans/status").then(r => r.json()).then(d => {
      setPlanData(d);
      const seen = localStorage.getItem("seenFreeCallPopup");
      if (d?.hasFreeCall && !seen) setTimeout(() => setShowFreePopup(true), 1500);
    }).catch(() => {});
  }, [isUser, user?.id]);

  function closeWelcome() { setShowWelcome(false); localStorage.setItem("hasSeenWelcomePopup", "true"); }
  function closeFreePopup() { setShowFreePopup(false); localStorage.setItem("seenFreeCallPopup", "true"); }

  const services = [
    { title: "Expert Consultation", desc: "Live guidance from certified pandits",    icon: <Phone size={28} />,        href: "/consult",      gradient: "from-blue-500 to-cyan-500",     bg: "from-blue-50 to-cyan-50",     badge: "24/7" },
    { title: "Spiritual Remedies",  desc: "Personalized solutions for life",         icon: <Sparkles size={28} />,     href: "/remedies",     gradient: "from-purple-500 to-pink-500",   bg: "from-purple-50 to-pink-50",   badge: "Personal" },
    { title: "Sacred Products",     desc: "Authentic spiritual items",               icon: <Package size={28} />,      href: "/allproducts",  gradient: "from-emerald-500 to-teal-500",  bg: "from-emerald-50 to-teal-50",  badge: "Authentic" },
    { title: "Live Ceremonies",     desc: "Book traditional poojas and rituals",     icon: <CalendarHeart size={28} />,href: "/ceremonies",   gradient: "from-orange-500 to-yellow-500", bg: "from-orange-50 to-yellow-50", badge: "Live" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 overflow-x-hidden">

      {/* Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-10 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <PageHeader />

      {/* ── HERO ── */}
      <section className="relative w-full px-5 sm:px-10 md:px-16 pt-10 pb-16 md:py-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

          {/* LEFT */}
          <div className="flex-1 flex flex-col items-start gap-6 z-10 w-full">

            {/* Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/50">
              <div className="w-2 h-2 bg-[#9B59B6] rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                🕉️ Vedic Astrology • Certified Experts
              </span>
              <Star size={12} className="text-purple-500" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                Understand your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
                life with clarity
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-lg leading-relaxed">
              Not predictions. Just meaningful insights from
              <span className="font-bold text-gray-800"> certified pandits</span> — whenever you need guidance.
            </p>

            {/* ✅ Free call strip for logged-in users with free call */}
            {isUser && planData?.hasFreeCall && (
              <div className="w-full max-w-xs">
                <FreeCallStrip onClaim={() => router.push("/consult")} />
              </div>
            )}

            {/* CTAs */}
            <div className="flex items-center gap-3 flex-wrap">
              {isLoggedIn ? (
                <button
                  onClick={() => router.push(user?.role === "pandit" ? "/pandit" : "/consult")}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-sm sm:text-base hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  {user?.role === "pandit" ? "Go to Dashboard" : "Talk to an Expert"}
                  <ChevronRight size={18} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-sm sm:text-base hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Get Started Free <Gift size={16} />
                  </button>
                  <button
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2 px-6 py-3.5 bg-white/80 border-2 border-gray-200 hover:border-purple-300 text-gray-700 rounded-2xl font-bold text-sm sm:text-base hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    Login <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — image */}
          <div className="flex-1 flex justify-center md:justify-end relative z-10 w-full">
            <div className="relative group w-full max-w-[400px] md:max-w-none">

              {/* Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-[2.5rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity animate-pulse" />

              {/* Image */}
              <div
                className="relative rounded-[2rem] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
                style={{ width: "100%", aspectRatio: "4/5", maxHeight: 500 }}
              >
                <Image src="/hero.jpg" alt="Expert pandit consultation" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Live badge */}
                <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-xl shadow-lg">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live Now
                  </div>
                </div>

                {/* ✅ Talktime widget over image bottom-left */}
                {isUser && (
                  <div className="absolute bottom-4 left-4 right-4 sm:right-auto">
                    <TalktimeCard userId={user?.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="w-full px-5 sm:px-10 md:px-16 pb-24">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
              Your Spiritual Journey Awaits
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto">
              Explore our comprehensive spiritual services designed for your growth
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {services.map((item) => (
              <div
                key={item.title}
                onClick={() => router.push(item.href)}
                className={`group relative cursor-pointer bg-gradient-to-br ${item.bg} rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/50 shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-2 overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl sm:rounded-3xl`} />

                {/* Badge */}
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600">
                  {item.badge}
                </div>

                <div className="relative z-10 flex flex-col min-h-[180px] sm:min-h-[220px]">
                  {/* Icon */}
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                    {item.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1 sm:mb-2 leading-tight">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed hidden sm:block">{item.desc}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/40 mt-3">
                    <span className={`text-xs font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                      Explore
                    </span>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow`}>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popups */}
      {showFreePopup && (
        <FreeCallPopup
          onClose={closeFreePopup}
          onStart={() => { closeFreePopup(); router.push("/consult"); }}
        />
      )}
      <WelcomePopup
        isOpen={showWelcome}
        onClose={closeWelcome}
        onStartConsultation={() => { closeWelcome(); router.push("/consult"); }}
        userName={user?.name || user?.username || "Friend"}
      />

      <style jsx>{`
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}
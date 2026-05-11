"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated" && session?.user;
  const user = session?.user;
  const isLoading = status === "loading";

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── NAVBAR ── */}
      <nav className="w-full px-6 md:px-16 py-4 flex items-center justify-between border-b border-black/10 bg-background sticky top-0 z-50">

        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden">
            <Image
              src="/logo.jpg"
              alt="Rantraa"
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          </div>
          <span
            style={{ fontFamily: "var(--font-primary)" }}
            className="text-lg font-semibold text-main"
          >
            Rantraa
          </span>
        </div>

        {/* Nav Links — desktop only */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-secondary hover:text-main transition">
            Features
          </a>
          <a href="#experts" className="text-sm text-secondary hover:text-main transition">
            Our Experts
          </a>
          <a href="#how" className="text-sm text-secondary hover:text-main transition">
            How it works
          </a>
        </div>

        {/* Right side — profile or CTA */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-primary-main border-t-transparent rounded-full animate-spin" />
          ) : isLoggedIn ? (
            // ── Logged in: show profile ──
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(user?.role === "pandit" ? "/pandit" : "/home")}
                className="hidden md:block text-sm px-4 py-2 rounded-[var(--R16)] bg-primary-main text-white hover:opacity-90 transition cursor-pointer"
              >
                {user?.role === "pandit" ? "Dashboard" : "Talk to Expert"}
              </button>

              {/* Profile pill */}
              <button
                onClick={() => router.push(user?.role === "pandit" ? "/pandit" : "/home")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/10 bg-secondary-main hover:bg-black/5 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? ""}
                      width={28}
                      height={28}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary-main">
                      {user?.name?.slice(0, 1).toUpperCase() ?? "U"}
                    </span>
                  )}
                </div>
                <span className="text-xs text-main font-medium hidden sm:block max-w-[100px] truncate">
                  {user?.username ?? user?.name?.split(" ")[0] ?? "Profile"}
                </span>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-secondary hover:text-red-500 transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            // ── Logged out ──
            <button
              onClick={() => router.push("/login")}
              className="text-sm px-5 py-2 rounded-[var(--R16)] bg-primary-main text-white hover:opacity-90 transition cursor-pointer"
            >
              Get Started
            </button>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="flex-1 w-full px-6 md:px-16 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12 max-w-7xl mx-auto">

        {/* Left — text content */}
        <div className="flex-1 flex flex-col items-start gap-6">

          {/* Tag */}
          <span className="text-xs px-3 py-1.5 rounded-full bg-primary-main/10 text-primary-main font-medium">
            🕉️ Vedic Astrology · Certified Experts
          </span>

          {/* Heading */}
          <h1
            style={{ fontFamily: "var(--font-primary)", fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.2 }}
            className="font-semibold text-main"
          >
            Understand your life<br />
            <span style={{ color: "var(--primary-main)" }}>with clarity.</span>
          </h1>

          <p className="text-secondary body-default max-w-md">
            Not predictions. Just meaningful insights from certified pandits — available whenever you need guidance.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {isLoggedIn ? (
              <button
                onClick={() => router.push(user?.role === "pandit" ? "/pandit" : "/home")}
                className="px-6 py-3 bg-primary-main text-white rounded-[var(--R16)] hover:opacity-90 transition text-sm font-medium cursor-pointer"
              >
                {user?.role === "pandit" ? "Go to Dashboard →" : "Talk to an Expert →"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/login")}
                  className="px-6 py-3 bg-primary-main text-white rounded-[var(--R16)] hover:opacity-90 transition text-sm font-medium cursor-pointer"
                >
                  Get Started Free →
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="px-6 py-3 border border-black/20 text-main rounded-[var(--R16)] hover:bg-black/5 transition text-sm cursor-pointer"
                >
                  Login
                </button>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex -space-x-2">
              {["A", "R", "S", "M"].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "var(--primary-main)", opacity: 0.7 + i * 0.08 }}
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-secondary">
              <span className="font-semibold text-main">1,200+</span> sessions this month
            </p>
          </div>
        </div>

        {/* Right — hero image + floating card */}
        <div className="flex-1 flex justify-center md:justify-end relative">

          {/* Hero image */}
          <div
            className="relative rounded-[var(--R24)] overflow-hidden shadow-md"
            style={{ width: "min(420px, 90vw)", height: "min(480px, 60vw)", minHeight: 280 }}
          >
            <Image
              src="/hero.jpg"
              alt="Pandit session"
              fill
              className="object-cover"
            />
            {/* Overlay gradient */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(52,21,57,0.5) 0%, transparent 60%)" }}
            />
          </div>

          {/* Floating profile card — bottom left of image */}
          {isLoggedIn && (
            <div
              className="absolute bottom-4 left-0 md:-left-8 bg-secondary-main border border-black/10 rounded-[var(--R16)] px-4 py-3 flex items-center gap-3 shadow-sm"
              style={{ maxWidth: 220 }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-white">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ""}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-main/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-main">
                      {user?.name?.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-main truncate">
                  {user?.username ? `@${user.username}` : user?.name}
                </p>
                <p className="text-xs text-secondary">
                  {user?.role === "pandit" ? "🕉️ Pandit" : "✨ Member"}
                </p>
              </div>
            </div>
          )}

          {/* Floating stat card — top right */}
          <div
            className="absolute top-4 -right-0 md:-right-6 bg-secondary-main border border-black/10 rounded-[var(--R16)] px-4 py-3 shadow-sm"
          >
            <p className="text-xs text-secondary">Avg. rating</p>
            <p className="text-lg font-semibold text-main" style={{ fontFamily: "var(--font-primary)" }}>
              4.9 ⭐
            </p>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="w-full px-6 md:px-16 py-16 max-w-7xl mx-auto">
        <p className="text-xs text-secondary uppercase tracking-widest mb-2">Why Rantraa</p>
        <h2
          style={{ fontFamily: "var(--font-primary)" }}
          className="text-2xl font-semibold text-main mb-10"
        >
          Guidance you can trust
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🕉️",
              title: "Certified Pandits",
              desc: "Every expert is vetted and trained in Vedic astrology and related traditions.",
            },
            {
              icon: "📞",
              title: "Instant Voice Calls",
              desc: "Connect in seconds. No scheduling, no waiting rooms — just talk.",
            },
            {
              icon: "🔒",
              title: "Private & Secure",
              desc: "Your conversations are confidential. We never share your data.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-secondary-main rounded-[var(--R24)] p-6 flex flex-col gap-3 border border-black/10"
            >
              <span className="text-3xl">{f.icon}</span>
              <p className="font-semibold text-main" style={{ fontFamily: "var(--font-primary)" }}>
                {f.title}
              </p>
              <p className="text-sm text-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="w-full px-6 md:px-16 py-16 bg-secondary-main">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-secondary uppercase tracking-widest mb-2">Simple process</p>
          <h2
            style={{ fontFamily: "var(--font-primary)" }}
            className="text-2xl font-semibold text-main mb-10"
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Sign up", desc: "Login with Google in one tap." },
              { step: "02", title: "Set profile", desc: "Add your name and date of birth." },
              { step: "03", title: "Request call", desc: "Pick a pandit and send a request." },
              { step: "04", title: "Get guidance", desc: "Pandit calls you back within minutes." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-2">
                <span
                  className="text-4xl font-bold opacity-20 text-main"
                  style={{ fontFamily: "var(--font-primary)" }}
                >
                  {s.step}
                </span>
                <p className="font-semibold text-main text-sm">{s.title}</p>
                <p className="text-xs text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full px-6 md:px-16 py-8 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <Image src="/logo.jpg" alt="Rantraa" width={24} height={24} className="object-cover" />
          </div>
          <span className="text-sm text-secondary" style={{ fontFamily: "var(--font-primary)" }}>
            Rantraa © 2026
          </span>
        </div>
        <p className="text-xs text-secondary">
          Meaningful insights, not predictions.
        </p>
      </footer>

    </div>
  );
}
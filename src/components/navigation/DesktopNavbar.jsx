'use client'

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const userNavLinks = [
  { label: "Rituals", href: "/rituals" },
  { label: "Consult", href: "/consult" },
  { label: "Ceremonies", href: "/ceremonies" },
  { label: "Remedies", href: "/remedies" },
  { label: "Products", href: "/allproducts" },
  { label: "Settings", href: "/settings" },
];

const panditNavLinks = [
  { label: "Dashboard", href: "/pandit/dashboard" },
  { label: "Call Requests", href: "/pandit/requests" },
  { label: "History", href: "/pandit/history" },
  { label: "Earnings", href: "/pandit/earnings" },
];

export default function DesktopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // ✅ Fetch current user (works for both Google + OTP)
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setCurrentUser(data);
        setUserLoading(false);
      })
      .catch(() => setUserLoading(false));
  }, []);

  // Use NextAuth session if available, fallback to /me response
  const user = session?.user ?? currentUser;
  const isLoading = status === "loading" || userLoading;
  const isLoggedIn = !!user;
  const isPandit = user?.role === "pandit";
  const navLinks = isPandit ? panditNavLinks : userNavLinks;

  // Profile display data
  const displayImage = user?.image ?? user?.profilePic ?? null;
  const displayName = user?.username ?? user?.name?.split(" ")[0] ?? "Profile";
  const displayInitial = (user?.username ?? user?.name ?? "U").slice(0, 1).toUpperCase();

  async function handleLogout() {
    // Clear OTP cookie
    await fetch("/api/auth/logout", { method: "POST" });
    // Clear NextAuth session
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <nav className="hidden lg:block sticky top-0 z-50 border-b border-black/10 bg-background/80 backdrop-blur-xl">
      <div className="relative mx-auto px-s40 h-[82px] flex items-center justify-between">

        {/* LEFT — Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-s40 h-s40 rounded-full overflow-hidden">
            <Image src="/logo.jpg" alt="Rantraa" width={40} height={40}
              className="object-cover w-full h-full" />
          </div>
          <span style={{ fontFamily: "var(--font-primary)" }}
            className="text-[1.2rem] font-semibold text-main">
            Rantraa
          </span>
        </Link>

        {/* CENTER — Nav links */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-s32">
          {navLinks.map((link) => {
           const isActive =
  pathname === link.href ||
  pathname.startsWith(link.href + "/");
            return (
              <Link key={link.href} href={link.href} className={`
                relative text-sm font-medium transition-all duration-300
                ${isActive ? "text-main" : "text-secondary hover:text-main"}
              `}>
                {link.label}
                {isActive && (
                  <div className="absolute -bottom-[10px] left-0 w-full h-[2px] bg-primary-main rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-s16">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-primary-main border-t-transparent rounded-full animate-spin" />

          ) : isLoggedIn ? (
            <>
              {/* Pandit badge */}
              {isPandit && (
                <span className="text-xs px-3 py-1 rounded-full bg-primary-main/10 text-primary-main font-medium">
                  🕉️ Pandit
                </span>
              )}

              {/* Profile pill */}
              <button
                onClick={() => router.push(isPandit ? "/pandit" : "/home")}
                className="flex items-center gap-3 px-s8 py-s8 rounded-full border border-black/10 bg-secondary-main hover:bg-black/5 transition-all cursor-pointer"
              >
                <div className="w-s40 h-s40 rounded-full overflow-hidden bg-primary-main/20 flex items-center justify-center flex-shrink-0">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary-main">
                      {displayInitial}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-main max-w-[120px] truncate">
                  {displayName}
                </span>
              </button>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                className="text-sm text-secondary hover:text-red-main transition-all cursor-pointer"
              >
                Sign out
              </button>
            </>

          ) : (
            <button
              onClick={() => router.push("/login")}
              className="text-sm px-s24 py-s8 rounded-r16 bg-primary-main text-white hover:opacity-90 transition-all cursor-pointer"
            >
              Get Started
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
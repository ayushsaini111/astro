'use client'

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Settings, CreditCard, HelpCircle, LogOut, User, ChevronDown } from "lucide-react";

const userNavLinks = [
  { label: "Rituals",    href: "/rituals" },
  { label: "Consult",    href: "/consult" },
  { label: "Ceremonies", href: "/ceremonies" },
  { label: "Remedies",   href: "/remedies" },
  { label: "Products",   href: "/allproducts" },
  { label: "Settings",   href: "/settings" },
];

const panditNavLinks = [
  { label: "Dashboard",     href: "/pandit/dashboard" },
  { label: "Call Requests", href: "/pandit/requests" },
  { label: "History",       href: "/pandit/history" },
  { label: "Earnings",      href: "/pandit/earnings" },
  { label: "Profile",      href: "/pandit/profile" },
];

function ProfileCompletion({ user }) {
  const fields = [
    !!user?.username,
    !!user?.dob,
    !!user?.phone,
    !!user?.email,
    !!user?.profilePic,
  ];
  const completed = fields.filter(Boolean).length;
  const percent = Math.round((completed / fields.length) * 100);
  return { percent, completed, total: fields.length };
}

export default function DesktopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const user = session?.user ?? null;
  const isLoading = status === "loading";
  const isLoggedIn = !!user;
  const isPandit = user?.role === "pandit";
  const navLinks = isPandit ? panditNavLinks : userNavLinks;

  const displayImage = user?.image ?? user?.profilePic ?? null;
  const displayName = user?.username ?? user?.name?.split(" ")[0] ?? "Profile";
  const displayInitial = (user?.username ?? user?.name ?? "U").slice(0, 1).toUpperCase();

  const { percent } = ProfileCompletion({ user });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ✅ FIXED: Redirect based on role
  async function handleLogout() {
    setDropdownOpen(false);
    const callbackUrl = isPandit ? "/pandit/login" : "/login";
    await signOut({ callbackUrl });
  }

  const menuItems = isPandit ? [
    { icon: User,       label: "Dashboard",      path: "/pandit" },
    { icon: CreditCard, label: "Earnings",        path: "/pandit/earnings" },
    { icon: Settings,   label: "Settings",        path: "/pandit/settings" },
    { icon: HelpCircle, label: "Help & Support",  path: "/support" },
  ] : [
    { icon: User,       label: "My Profile",      path: "/profile" },
    { icon: CreditCard, label: "Plans & Wallet",  path: "/plans" },
    { icon: Settings,   label: "Settings",        path: "/settings" },
    { icon: HelpCircle, label: "Help & Support",  path: "/support" },
  ];

  return (
    <nav className="hidden lg:block sticky top-0 z-50 border-b border-black/10 bg-background/80 backdrop-blur-xl">
      <div className="relative mx-auto px-s40 h-[82px] flex items-center justify-between">

        {/* LEFT — Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-s40 h-s40 rounded-full overflow-hidden">
            <Image src="/logo.jpg" alt="Rantraa" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <span style={{ fontFamily: "var(--font-primary)" }} className="text-[1.2rem] font-semibold text-main">
            Rantraa
          </span>
        </Link>

        {/* CENTER — Nav links */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-s32">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
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
            <div className="relative" ref={dropdownRef}>
              {isPandit && (
                <span className="text-xs px-3 py-1 rounded-full bg-primary-main/10 text-primary-main font-medium mr-2">
                  🕉️ Pandit
                </span>
              )}

              {/* Profile pill — click to open dropdown */}
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-3 px-s8 py-s8 rounded-full border border-black/10 bg-secondary-main hover:bg-black/5 transition-all cursor-pointer"
              >
                {/* Avatar with completion ring */}
                <div className="relative w-s40 h-s40 flex-shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="20" fill="none" stroke="#E8D8EA" strokeWidth="2.5" />
                    <circle
                      cx="22" cy="22" r="20" fill="none"
                      stroke="#9B59B6" strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - percent / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-[3px] rounded-full overflow-hidden bg-primary-main/20 flex items-center justify-center">
                    {displayImage ? (
                      <Image src={displayImage} alt={displayName} width={40} height={40}
                        className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-sm font-bold text-primary-main">{displayInitial}</span>
                    )}
                  </div>
                </div>

                <span className="text-sm font-medium text-main max-w-[120px] truncate">{displayName}</span>
                <ChevronDown size={14} className={`text-secondary transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white rounded-[20px] shadow-xl border border-black/5 overflow-hidden z-50">

                  {/* Profile summary */}
                  <div className="px-4 py-4 border-b border-black/5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 52 52">
                          <circle cx="26" cy="26" r="23" fill="none" stroke="#E8D8EA" strokeWidth="3" />
                          <circle cx="26" cy="26" r="23" fill="none" stroke="#9B59B6" strokeWidth="3"
                            strokeDasharray={`${2 * Math.PI * 23}`}
                            strokeDashoffset={`${2 * Math.PI * 23 * (1 - percent / 100)}`}
                            strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-[4px] rounded-full overflow-hidden bg-primary-main/20 flex items-center justify-center">
                          {displayImage ? (
                            <Image src={displayImage} alt={displayName} width={44} height={44}
                              className="object-cover w-full h-full" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-base font-bold text-primary-main">{displayInitial}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-main truncate">{displayName}</p>
                        <p className="text-xs text-secondary">{user?.email ?? user?.phone ?? ""}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-[#E8D8EA] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-main rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-primary-main font-medium">{percent}%</span>
                        </div>
                        {percent < 100 && (
                          <p className="text-[10px] text-secondary mt-0.5">Complete your profile</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    {menuItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => { setDropdownOpen(false); router.push(item.path); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F3EAF5] transition-colors text-left group"
                      >
                        <item.icon size={16} className="text-secondary group-hover:text-primary-main" />
                        <span className="text-sm text-main group-hover:text-primary-main">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-black/5 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group"
                    >
                      <LogOut size={16} className="text-red-400 group-hover:text-red-600" />
                      <span className="text-sm text-red-400 group-hover:text-red-600">Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
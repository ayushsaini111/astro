"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  User,
  Clock,
  Sparkles,
  Headphones,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";

const COLORS = {
  background: "#F4E6DB",
  card: "#F8EEE7",
  iconBg: "#F4E6DB",
  iconColor: "#7A4FA3",
  primaryText: "#2B2430",
  secondaryText: "#8B7B71",
  border: "#E8D7C8",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
};

const ACCOUNT_ITEMS = [
  {
    id: "personal",
    icon: User,
    title: "Personal Information",
    subtitle: "Manage name, photo and contact details",
    href: "/pandit/profile/manage/personal",
  },
  {
    id: "availability",
    icon: Clock,
    title: "Availability",
    subtitle: "Manage active status and working hours",
    href: "/pandit/profile/manage/availability",
  },
  {
    id: "expertise",
    icon: Sparkles,
    title: "Expertise & Languages",
    subtitle: "Update expertise, skills and languages",
    href: "/pandit/profile/manage/expertise",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    subtitle: "Manage alerts and notifications",
    href: "/pandit/profile/manage/notifications",
  },
];

const SUPPORT_ITEMS = [
  {
    id: "help",
    icon: Headphones,
    title: "Help & Support",
    subtitle: "Get help and support",
    href: "/pandit/profile/manage/help",
  },
  {
    id: "terms",
    icon: FileText,
    title: "Terms & Conditions",
    subtitle: "Read our terms",
    href: "/pandit/profile/manage/terms",
  },
  {
    id: "privacy",
    icon: Shield,
    title: "Privacy Policy",
    subtitle: "Learn how we protect your data",
    href: "/pandit/profile/manage/privacy",
  },
];

export default function ManageAccountPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      setShowConfirm(false);
    }
  };

  const MenuItem = ({ icon: Icon, title, subtitle, href, isDangerous, onClick }) => (
    <Link
      href={href || "#"}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex items-center gap-4 px-4 py-4 transition-all hover:bg-white active:scale-98"
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: isDangerous ? COLORS.dangerBg : COLORS.iconBg,
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: isDangerous ? COLORS.danger : COLORS.iconColor }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-base font-semibold"
          style={{ color: isDangerous ? COLORS.danger : COLORS.primaryText }}
        >
          {title}
        </p>
        <p className="text-sm mt-0.5" style={{ color: COLORS.secondaryText }}>
          {subtitle}
        </p>
      </div>

      <ChevronRight
        className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-1"
        style={{ color: COLORS.secondaryText }}
      />
    </Link>
  );

  return (
    <div style={{ backgroundColor: COLORS.background }} className="min-h-screen pb-8">
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 py-5 flex items-center justify-between border-b"
        style={{
          backgroundColor: COLORS.background,
          borderColor: COLORS.border,
        }}
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-white hover:shadow-md active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: COLORS.primaryText }} />
        </button>

        <h1 className="text-2xl font-bold flex-1 text-center" style={{ color: COLORS.primaryText }}>
          Manage Account
        </h1>

        <button
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:shadow-md active:scale-95 relative"
          style={{ backgroundColor: "white" }}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" style={{ color: COLORS.primaryText }} />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
        </button>
      </header>

      {/* Content */}
      <main className="py-8">
        {/* Account Section */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold mb-4 px-6"
            style={{ color: COLORS.primaryText }}
          >
            Account
          </h2>

          <div
            className="rounded-2xl overflow-hidden shadow-md border"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.border,
            }}
          >
            {ACCOUNT_ITEMS.map((item, index) => (
              <div
                key={item.id}
                style={
                  index === ACCOUNT_ITEMS.length - 1
                    ? {}
                    : {
                        borderBottom: `1px solid ${COLORS.border}`,
                      }
                }
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-4 py-4 transition-all hover:bg-white active:scale-98 block"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORS.iconBg }}
                  >
                    <item.icon
                      className="w-5 h-5"
                      style={{ color: COLORS.iconColor }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base font-semibold"
                      style={{ color: COLORS.primaryText }}
                    >
                      {item.title}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: COLORS.secondaryText }}>
                      {item.subtitle}
                    </p>
                  </div>

                  <ChevronRight
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: COLORS.secondaryText }}
                  />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Support Section */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold mb-4 px-6"
            style={{ color: COLORS.primaryText }}
          >
            Support
          </h2>

          <div
            className="rounded-2xl overflow-hidden shadow-md border"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.border,
            }}
          >
            {SUPPORT_ITEMS.map((item, index) => (
              <div
                key={item.id}
                style={
                  index === SUPPORT_ITEMS.length - 1
                    ? {}
                    : {
                        borderBottom: `1px solid ${COLORS.border}`,
                      }
                }
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-4 py-4 transition-all hover:bg-white active:scale-98 block"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORS.iconBg }}
                  >
                    <item.icon
                      className="w-5 h-5"
                      style={{ color: COLORS.iconColor }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base font-semibold"
                      style={{ color: COLORS.primaryText }}
                    >
                      {item.title}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: COLORS.secondaryText }}>
                      {item.subtitle}
                    </p>
                  </div>

                  <ChevronRight
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: COLORS.secondaryText }}
                  />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Account Section - Logout */}
        <section className="mb-8">
          <h2
            className="text-lg font-bold mb-4 px-6"
            style={{ color: COLORS.primaryText }}
          >
            Account
          </h2>

          <div
            className="rounded-2xl overflow-hidden shadow-md border"
            style={{
              backgroundColor: COLORS.card,
              borderColor: COLORS.border,
            }}
          >
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center gap-4 px-4 py-4 transition-all hover:bg-white active:scale-98 text-left"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: COLORS.dangerBg }}
              >
                <LogOut className="w-5 h-5" style={{ color: COLORS.danger }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold" style={{ color: COLORS.danger }}>
                  Log Out
                </p>
                <p className="text-sm mt-0.5" style={{ color: COLORS.secondaryText }}>
                  Sign out from your account
                </p>
              </div>

              <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.secondaryText }} />
            </button>
          </div>
        </section>
      </main>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div
            className="rounded-2xl p-6 shadow-xl max-w-sm w-full"
            style={{ backgroundColor: COLORS.card }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.primaryText }}>
              Log Out?
            </h3>
            <p className="text-sm mb-6" style={{ color: COLORS.secondaryText }}>
              Are you sure you want to log out from your account?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 rounded-lg border font-medium text-sm transition-all hover:bg-white active:scale-95"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.primaryText,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: COLORS.danger }}
              >
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-2xl p-6 shadow-xl"
            style={{ backgroundColor: COLORS.card }}
          >
            <div
              className="w-10 h-10 border-4 border-gray-300 border-t-4 rounded-full animate-spin mx-auto mb-4"
              style={{ borderTopColor: COLORS.iconColor }}
            />
            <p style={{ color: COLORS.primaryText }} className="text-center font-medium">
              Logging out...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
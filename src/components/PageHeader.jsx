'use client'

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Settings, 
  Heart, 
  ShoppingBag, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  LogOut, 
  X,
  Calendar,
  Phone,
  Star
} from "lucide-react";

function PageHeader({
  title,
  subtitle,
  notificationClassName = "",
  profileClassName = "",
  className = "",
  
  // ✅ Optional props as fallback
  userId = null,
  profilePic = null,
  username = null,
  role = null,
  
  // ✅ Show/hide controls
  showNotification = true,
  showProfile = true,
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ State for sidebar
  const [showSidebar, setShowSidebar] = useState(false);

  // ✅ Fetch current user
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          setCurrentUser(data);
          setUserLoading(false);
        })
        .catch(() => setUserLoading(false));
    } else {
      setUserLoading(false);
    }
  }, [userId]);

  // ✅ Merge user data
  const user = userId 
    ? { id: userId, username, profilePic, role }
    : (session?.user ?? currentUser);

  const isLoading = status === "loading" || userLoading;
  const isLoggedIn = !!user;

  // Profile display data
  const resolvedImage = user?.image ?? user?.profilePic ?? null;
  const resolvedName = user?.username ?? user?.name ?? null;
  const resolvedRole = user?.role ?? "user";
  const initials = (resolvedName ?? "U").slice(0, 1).toUpperCase();

  // ✅ Handle profile click - open sidebar
  const handleProfileClick = () => {
    setShowSidebar(true);
  };

  // ✅ Handle notification click
  const handleNotificationClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    router.push("/notifications");
  };

  // ✅ Handle logout
  const handleLogout = async () => {
    setShowSidebar(false);
    // Clear OTP cookie
    await fetch("/api/auth/logout", { method: "POST" });
    // Clear NextAuth session
    await signOut({ callbackUrl: "/login" });
  };

  // ✅ Navigation items based on role and login status
  const getNavigationItems = () => {
    if (!isLoggedIn) {
      return [
        { icon: User, label: "Login", path: "/login" },
        { icon: HelpCircle, label: "Help & Support", path: "/support" },
      ];
    }

    if (resolvedRole === "pandit") {
      return [
        { icon: User, label: "Dashboard", path: "/pandit" },
        { icon: Phone, label: "Call Requests", path: "/pandit/requests" },
        { icon: Calendar, label: "History", path: "/pandit/history" },
        { icon: CreditCard, label: "Earnings", path: "/pandit/earnings" },
        { icon: Settings, label: "Settings", path: "/pandit/settings" },
        { icon: HelpCircle, label: "Help & Support", path: "/support" },
      ];
    }

    // Regular user navigation
    return [
      { icon: User, label: "Profile", path: "/profile" },
      { icon: ShoppingBag, label: "Orders", path: "/orders" },
      { icon: Heart, label: "Favorites", path: "/favorites" },
      { icon: Calendar, label: "Bookings", path: "/bookings" },
      { icon: CreditCard, label: "Plans & Wallet", path: "/plans" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
      { icon: Settings, label: "Settings", path: "/settings" },
      { icon: HelpCircle, label: "Help & Support", path: "/support" },
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      <div className={`flex items-start py-s16 px-s16 md:px-s32 justify-between ${className}`}>
        {/* Left Content */}
        <div>
          <h1 className="heading-h2 text-main">{title}</h1>
          {subtitle && (
            <p className="body-default text-secondary">{subtitle}</p>
          )}
        </div>

        {/* Right Content — mobile only */}
        <div className="flex justify-center items-center gap-s16 md:hidden">
          {/* Notification bell */}
          {showNotification && (
            <button 
              onClick={handleNotificationClick}
              className={`
                w-s40 h-s40 rounded-full border border-secondary
                flex items-center justify-center
                hover:bg-black/5 transition-colors
                ${notificationClassName}
              `}
            >
              🔔
            </button>
          )}

          {/* Profile avatar */}
          {showProfile && (
            <button
              onClick={handleProfileClick}
              className={`
                w-s48 h-s48 rounded-full overflow-hidden
                flex items-center justify-center
                border border-black/10 flex-shrink-0
                cursor-pointer bg-primary-main/10
                hover:opacity-80 transition-opacity
                ${profileClassName}
              `}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-main border-t-transparent rounded-full animate-spin" />
              ) : resolvedImage ? (
                <Image
                  src={resolvedImage}
                  alt={resolvedName ?? "Profile"}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                />
              ) : isLoggedIn ? (
                <span className="text-sm font-bold text-primary-main">
                  {initials}
                </span>
              ) : (
                <span className="text-lg">👤</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ✅ Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-main">Menu</h2>
              <button 
                onClick={() => setShowSidebar(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Profile Section */}
            {isLoggedIn && (
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-main/10 flex items-center justify-center flex-shrink-0">
                    {resolvedImage ? (
                      <Image
                        src={resolvedImage}
                        alt={resolvedName ?? "Profile"}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-xl font-bold text-primary-main">
                        {initials}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-main truncate">
                      {resolvedName ?? "User"}
                    </h3>
                    <p className="text-sm text-secondary capitalize">
                      {resolvedRole}
                    </p>
                    {resolvedRole === "pandit" && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-yellow-500" />
                        <span className="text-xs text-yellow-600">Verified Expert</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4">
                {navigationItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setShowSidebar(false);
                      router.push(item.path);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <item.icon size={20} className="text-gray-600 group-hover:text-primary-main" />
                    <span className="text-left text-gray-700 group-hover:text-primary-main">
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Footer */}
            {isLoggedIn && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 p-4 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* App Version */}
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400">Rantraa v1.0.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PageHeader;
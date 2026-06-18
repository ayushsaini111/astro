"use client";
import Image from "next/image";
import PanditStatusToggle from "@/components/Pandits/PanditStatusToggle";

export default function RequestsHeader({ 
  heading = "Call Requests", 
  subheading, 
  panditData,
  showProfileOnMobile = true,
  notificationCount = 0
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      {/* Left: Heading & Subheading */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-main mb-1 truncate">{heading}</h1>
        {subheading && (
          <p className="text-sm text-secondary truncate">{subheading}</p>
        )}
      </div>

      {/* Right: Toggle + Notification + Profile (mobile only) */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Toggle Button */}
        {panditData && (
          <PanditStatusToggle 
            panditId={panditData.id} 
            initialStatus={panditData.isAvailable} 
          />
        )}

        {/* Notification Icon */}
        <div className="relative">
          <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <svg
              className="w-5 h-5 text-main"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {notificationCount}
            </span>
          )}
        </div>

        {/* Profile Circle (visible only on mobile) */}
        {showProfileOnMobile && panditData && (
          <div className="md:hidden relative w-10 h-10 overflow-hidden rounded-full bg-gray-100 flex-shrink-0 border-2 border-primary-main/20">
            <Image
              src={panditData.profilePic || "/default-avatar.png"}
              alt={panditData.name || "Pandit"}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              priority
            />
          </div>
        )}
      </div>
    </div>
  );
}
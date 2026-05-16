'use client'

import React from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function PageHeader({
  title,
  subtitle,
  notificationClassName = "",
  profileClassName = "",
  className = "",
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;

  const initials = user?.name?.slice(0, 1).toUpperCase()
    ?? user?.username?.slice(0, 1).toUpperCase()
    ?? "U";

  return (
    <div className={`flex items-start py-s16 px-s16 md:px-s32 justify-between ${className}`}>

      {/* Left Content */}
      <div>
        <h1 className="heading-h2 text-main">{title}</h1>
        {subtitle && (
          <p className="body-default text-secondary">{subtitle}</p>
        )}
      </div>

      {/* Right Content — mobile only */}
      <div className="flex justify-center items-center gap-s16 md:hidden md:gap-s32">

        {/* Notification bell */}
        <button className={`
          w-s40 h-s40 rounded-full border border-secondary
          flex items-center justify-center
          ${notificationClassName}
        `}>
          🔔
        </button>

        {/* Profile avatar */}
        <button
          onClick={() => router.push(user?.role === "pandit" ? "/pandit" : "/home")}
          className={`
            w-s48 h-s48 rounded-full overflow-hidden
            flex items-center justify-center
            border border-black/10 flex-shrink-0
            cursor-pointer
            ${profileClassName}
          `}
        >
          {status === "loading" ? (
            // Loading spinner
            <div className="w-5 h-5 border-2 border-primary-main border-t-transparent rounded-full animate-spin" />

          ) : user?.image ? (
            // Google profile pic
            <Image
              src={user.image}
              alt={user.name ?? ""}
              width={48}
              height={48}
              className="object-cover w-full h-full"
              referrerPolicy="no-referrer"
            />

          ) : (
            // Initials fallback
            <div className="w-full h-full bg-primary-main/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-main">
                {initials}
              </span>
            </div>
          )}
        </button>

      </div>

    </div>
  );
}

export default PageHeader;
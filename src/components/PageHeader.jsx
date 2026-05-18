"use client";

import React, { useState } from "react";

import Image from "next/image";

import { useSession } from "next-auth/react";

import MobileSidebar from "@/components/layout/MobileSidebar";

function PageHeader({
  title,
  subtitle,
  notificationClassName = "",
  profileClassName = "",
  className = "",
}) {
  const { data: session, status } =
    useSession();

  const user = session?.user;

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const initials =
    user?.name
      ?.slice(0, 1)
      .toUpperCase() ??
    user?.username
      ?.slice(0, 1)
      .toUpperCase() ??
    "U";

  return (
    <>
      {/* SIDEBAR */}
      <MobileSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
        user={user}
      />

      {/* HEADER */}
      <div
        className={`
          flex
          items-start

          py-s16
          px-s16
          md:px-s32

          justify-between

          ${className}
        `}
      >

        {/* LEFT */}
        <div>

          <h1 className="heading-h2 text-main">
            {title}
          </h1>

          {subtitle && (
            <p className="body-default text-secondary">
              {subtitle}
            </p>
          )}

        </div>

        {/* RIGHT */}
        <div
          className="
            flex
            justify-center
            items-center

            gap-s16

            md:hidden
          "
        >

          {/* BELL */}
          <button
            className={`
              w-s40
              h-s40

              rounded-full

              border
              border-secondary

              flex
              items-center
              justify-center

              ${notificationClassName}
            `}
          >
            🔔
          </button>

          {/* PROFILE */}
          <button
            onClick={() =>
              setSidebarOpen(true)
            }
            className={`
              w-s48
              h-s48

              rounded-full
              overflow-hidden

              flex
              items-center
              justify-center

              border
              border-black/10

              flex-shrink-0

              cursor-pointer

              ${profileClassName}
            `}
          >

            {status === "loading" ? (
              <div
                className="
                  w-5
                  h-5

                  border-2
                  border-primary-main
                  border-t-transparent

                  rounded-full

                  animate-spin
                "
              />
            ) : user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={48}
                height={48}
                className="
                  object-cover
                  w-full
                  h-full
                "
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="
                  w-full
                  h-full

                  bg-primary-main/20

                  flex
                  items-center
                  justify-center
                "
              >

                <span
                  className="
                    text-sm
                    font-bold

                    text-primary-main
                  "
                >
                  {initials}
                </span>

              </div>
            )}

          </button>

        </div>

      </div>
    </>
  );
}

export default PageHeader;
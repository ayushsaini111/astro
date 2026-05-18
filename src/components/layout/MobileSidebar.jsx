"use client";

import React from "react";
import Image from "next/image";

import {
  X,
  Home,
  Package,
  Sparkles,
  Phone,
  Settings,
  LogOut,
} from "lucide-react";

import { signOut } from "next-auth/react";

import { useRouter } from "next/navigation";

import SidebarLink from "./SidebarLink";

function MobileSidebar({
  open,
  onClose,
  user,
}) {
  const router = useRouter();

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        className={`
          fixed
          inset-0

          bg-black/40
          backdrop-blur-sm

          z-50

          transition-all
          duration-300

          ${
            open
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          }
        `}
      />

      {/* SIDEBAR */}
      <div
        className={`
          fixed
          top-0
          right-0

          h-screen
          w-[85%]
          max-w-[340px]

          bg-[#FFF7F1]

          z-[60]

          flex
          flex-col

          transition-all
          duration-300

          ${
            open
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >

        {/* HEADER */}
        <div
          className="
            flex
            items-center
            justify-between

            p-s24
          "
        >

          {/* USER */}
          <div className="flex items-center gap-s12">

            <div
              className="
                relative

                w-s56
                h-s56

                rounded-full
                overflow-hidden

                bg-primary-main/20
              "
            >

              {user?.image ? (
                <Image
                  src={user.image}
                  alt="Profile"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="
                    w-full
                    h-full

                    flex
                    items-center
                    justify-center

                    text-primary-main
                    font-bold
                  "
                >
                  {user?.name
                    ?.slice(0, 1)
                    .toUpperCase() || "U"}
                </div>
              )}

            </div>

            <div>

              <h3
                className="
                  text-[16px]
                  font-semibold

                  text-main
                "
              >
                {user?.name || "User"}
              </h3>

              <p
                className="
                  text-[13px]

                  text-secondary
                "
              >
                Welcome back
              </p>

            </div>

          </div>

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="
              w-s40
              h-s40

              rounded-full

              bg-[#F6EEE7]

              flex
              items-center
              justify-center
            "
          >
            <X
              size={20}
              className="text-main"
            />
          </button>

        </div>

        {/* LINKS */}
        <div
          className="
            flex
            flex-col

            gap-s8

            px-s16
            pt-s8
          "
        >

          <SidebarLink
            icon={<Home size={20} />}
            label="Home"
            onClick={() =>
              router.push("/")
            }
          />

          <SidebarLink
            icon={
              <Sparkles size={20} />
            }
            label="Remedies"
            onClick={() =>
              router.push("/remedies")
            }
          />

          <SidebarLink
            icon={
              <Package size={20} />
            }
            label="Products"
            onClick={() =>
              router.push("/products")
            }
          />

          <SidebarLink
            icon={<Phone size={20} />}
            label="Consult"
            onClick={() =>
              router.push("/consult")
            }
          />

          <SidebarLink
            icon={
              <Settings size={20} />
            }
            label="Settings"
            onClick={() =>
              router.push("/settings")
            }
          />

        </div>

        {/* BOTTOM */}
        <div className="mt-auto p-s16">

          <SidebarLink
            danger
            icon={<LogOut size={20} />}
            label="Logout"
          onClick={() =>
  signOut({
    callbackUrl: "/",
  })
}
          />

        </div>

      </div>
    </>
  );
}

export default MobileSidebar;
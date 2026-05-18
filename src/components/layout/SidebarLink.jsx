"use client";

import React from "react";

function SidebarLink({
  icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full

        flex
        items-center
        gap-s16

        px-s16
        py-s16

        rounded-r24

        transition-all
        duration-200

        ${
          danger
            ? "text-red-500 hover:bg-red-50"
            : "text-main hover:bg-[#F6EEE7]"
        }
      `}
    >

      <div>{icon}</div>

      <span
        className="
          text-[15px]
          font-medium
        "
      >
        {label}
      </span>

    </button>
  );
}

export default SidebarLink;
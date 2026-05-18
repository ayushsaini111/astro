"use client";

import React from "react";
import Image from "next/image";

import Button from "@/components/ui/Button";

function PanditCard({
  pandit,

  requested,
  loading,

  isLoggedIn,

  onCall,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between

        gap-s16

        p-s16

        rounded-r32

        bg-[#F4E7DD]

        transition-all
        duration-300

        hover:shadow-md
      "
    >

      {/* LEFT */}
      <div
        className="
          flex
          items-center
          gap-s16
        "
      >

        {/* IMAGE */}
        <div
          className="
            relative
            rounded-full
            w-s56
            h-s56

            rounded-r20

            overflow-hidden

            bg-[#D9C9BC]

            flex-shrink-0
          "
        >

          {pandit.profilePic ? (
            <Image
              src={pandit.profilePic}
              alt={pandit.name}
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

                text-main

                font-semibold
                text-lg
              "
            >
              {pandit.name
                ?.slice(0, 2)
                .toUpperCase()}
            </div>
          )}

        </div>

        {/* CONTENT */}
        <div
          className="
            flex
            flex-col

            gap-[2px]
          "
        >

          {/* ONLINE */}
          <span
            className="
              text-[12px]

              text-[#4A9B67]
            "
          >
            ● Online
          </span>

          {/* NAME */}
          <h3
            className="
              heading-h6

              font-medium

              text-main

              leading-[120%]
            "
          >
            {pandit.name}
          </h3>

          {/* SPECIALITY */}
          <p
            className="
              caption

              text-secondary
            "
          >
            {pandit.speciality}
          </p>

         

        </div>

      </div>

      {/* BUTTON */}
      <Button
        variant="primary"
        disabled={loading || requested}
        onClick={() => onCall(pandit)}
        className="
          !rounded-full

          whitespace-nowrap

          !px-s16
          !py-s10

          disabled:opacity-50
        "
      >
        {loading
          ? "..."
          : requested
          ? "Requested ✓"
          : !isLoggedIn
          ? "Login to Call"
          : "Call Now"}
      </Button>

    </div>
  );
}

export default PanditCard;
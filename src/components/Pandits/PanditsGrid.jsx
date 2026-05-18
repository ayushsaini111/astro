"use client";

import React from "react";

import { ChevronDown } from "lucide-react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import PanditCard from "./PanditCard";

function PanditsGrid({
  sectionTitle = "All Pandits",

  pandits = [],

  requestedCalls = {},

  loadingId,

  onRequestCall,

  userId,
}) {
  const { data: session } =
    useSession();

  const router = useRouter();

  /* LOGIN CHECK */
  const isLoggedIn =
    !!session?.user || !!userId;

  /* CALL */
  function handleCallClick(pandit) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    onRequestCall?.(pandit);
  }

  return (
    <section
      className="
        flex
        flex-col

        gap-s24

        pb-s40
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          items-center
          justify-between

          px-s16
          lg:px-s32
        "
      >

        <h2
          className="
            heading-h5

            text-main
          "
        >
          {sectionTitle}
        </h2>

        <button
          className="
            flex
            items-center
            gap-s4

            text-[13px]

            text-primary-light
          "
        >

          Sort

          <ChevronDown size={14} />

        </button>

      </div>

      {/* EMPTY */}
      {pandits.length === 0 && (
        <p
          className="
            text-center

            text-secondary

            px-s16
          "
        >
          No experts available right now
        </p>
      )}

      {/* LIST */}
      <div
        className="
          flex
          flex-col

          gap-s16

          px-s16
          lg:px-s32
        "
      >

        {pandits.map((pandit) => {
          const requested =
            !!requestedCalls[pandit.id];

          const loading =
            loadingId === pandit.id;

          return (
            <PanditCard
              key={pandit.id}
              pandit={pandit}
              requested={requested}
              loading={loading}
              isLoggedIn={isLoggedIn}
              onCall={handleCallClick}
            />
          );
        })}

      </div>

      {/* LOGIN MESSAGE */}
      {!isLoggedIn && (
        <p
          className="
            text-center

            text-secondary

            text-[13px]
          "
        >

          <button
            onClick={() =>
              router.push("/login")
            }
            className="
              text-primary-main
              underline
            "
          >
            Login
          </button>{" "}
          to consult with our experts

        </p>
      )}

    </section>
  );
}

export default PanditsGrid;
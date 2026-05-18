"use client";

import React from "react";

import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  ChevronDown,
} from "lucide-react";

function CeremonySection() {
  return (
    <section
      className="
        flex
        flex-col
max-w-7xl mx-auto
        gap-s24

        px-s16
        pt-s16

        lg:px-s32
        lg:pt-s24
      "
    >

      {/* TOP BAR */}
      <div className="flex items-center justify-between">

        <button
          className="
            w-s40
            h-s40

            rounded-full

            flex
            items-center
            justify-center
          "
        >
          <ArrowLeft
            size={22}
            className="text-main"
          />
        </button>

        <h1
          className="
            heading-h4

            text-main
          "
        >
          Ceremonies
        </h1>

        <button
          className="
            w-s40
            h-s40

            rounded-full

            border
            border-[#D8C3E0]

            bg-[#F8F0EA]

            flex
            items-center
            justify-center
          "
        >
          <ShoppingBag
            size={18}
            className="text-[#8A5AB8]"
          />
        </button>

      </div>

      {/* CONTENT */}
      <div
        className="
          flex
          flex-col
          items-center

          gap-s16
        "
      >

        {/* TEXT */}
        <div
          className="
            flex
            flex-col
            items-center

            gap-s8
          "
        >

          <p
            className="
              text-center

              text-secondary

             body-default

              max-w-[280px]
            "
          >
            Sacred ceremonies for life's
            special moments
          </p>

        </div>

        {/* LOCATION */}
        <button
          className="
            h-s48

            px-s24

            rounded-full

            border
            border-[#BFAE9D]

            bg-[#F8F0EA]

            flex
            items-center
            gap-s10

            shadow-[0_10px_30px_rgba(0,0,0,0.04)]

            transition-all
            duration-300

            hover:scale-[1.02]
          "
        >

          <MapPin
            size={18}
            className="text-main"
          />

          <span
            className="
              text-[15px]
              lg:text-[16px]

              text-main

              font-medium
            "
          >
            Kanpur Uttar Pradesh
          </span>

          <ChevronDown
            size={18}
            className="text-main"
          />

        </button>

      </div>

      {/* POPULAR HEADER */}
      <div className="flex items-center justify-between">

        <h2
          className="
            heading-h5

            text-main
          "
        >
          Popular Ceremonies
        </h2>

        <button
          className="
            text-[14px]

            font-medium

            text-primary-light

            hover:opacity-80
            transition-all
          "
        >
          View All
        </button>

      </div>

    </section>
  );
}

export default CeremonySection;
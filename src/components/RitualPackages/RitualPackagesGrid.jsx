"use client";

import React from "react";
import Image from "next/image";

import {
  ArrowRight,
  ChevronDown,
} from "lucide-react";

function RitualPackagesGrid({
  sectionTitle = "All Packages",
  rituals = [],
}) {
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

        <h3
          className="
            heading-h5
            lg:text-[32px]

            text-main
          "
        >
          {sectionTitle}
        </h3>

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

      {/* GRID */}
      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4

          gap-x-s16
          gap-y-s32

          px-s16
          lg:px-s32
        "
      >

        {rituals.map((item) => (
          <div
            key={item.id}
            className="
              flex
              flex-col
              gap-s14

              group
              cursor-pointer
            "
          >

            {/* IMAGE */}
            <div
              className="
                relative

                w-full

                aspect-[1/0.72]

                rounded-r24
                overflow-hidden

                bg-[#EDE2D8]
              "
            >

              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="
                  (max-width:768px) 50vw,
                  (max-width:1280px) 33vw,
                  25vw
                "
                className="
                  object-cover

                  transition-transform
                  duration-700

                  group-hover:scale-105
                "
              />

              {/* GRADIENT */}
              <div
                className="
                  absolute
                  inset-0

                  bg-gradient-to-t
                  from-black/30
                  via-black/5
                  to-transparent
                "
              />

            </div>

            {/* CONTENT */}
            <div className="flex flex-col gap-s8">

              {/* TITLE */}
              <h4
                className="
                  text-[15px]
                  lg:text-[20px]

                  font-semibold

                  text-main

                  leading-[130%]
                "
              >
                {item.title}
              </h4>

              {/* DESCRIPTION */}
              <p
                className="
                  text-[13px]
                  lg:text-base

                  text-secondary

                  leading-relaxed
                "
              >
                {item.description}
              </p>

              {/* CTA */}
              <button
                className="
                  group/link

                  flex
                  items-center
                  gap-s4

                  text-[14px]

                  font-medium

                  text-primary-light

                  mt-s2
                "
              >

                Learn More

                <ArrowRight
                  size={14}
                  className="
                    transition-transform
                    duration-300

                    group-hover/link:translate-x-1
                  "
                />

              </button>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default RitualPackagesGrid;
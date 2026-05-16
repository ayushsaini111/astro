'use client'

import React from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

function RecentRitualExperiences({
  title = "Recent Ritual Experiences",
  rituals = [],
}) {
  return (
    <section className="flex flex-col gap-s24">

      {/* Header */}
      <div className="flex items-center justify-between">

        <h3 className="heading-h5 text-main px-s16">
          {title}
        </h3>

      </div>

      {/* Mobile Slider + Desktop Grid */}
      <div
        className="
          flex
          lg:grid
          lg:grid-cols-2
          xl:grid-cols-3
          gap-s24
          px-s16
          overflow-x-auto
          lg:overflow-visible
          hide-scrollbar
        "
      >

        {rituals.map((ritual, index) => (
          <div
            key={index}
            className="
              relative
              min-w-[280px]
              lg:min-w-0
              h-[170px]
              lg:h-[260px]
              xl:h-[300px]
              rounded-r40
              overflow-hidden
              flex-shrink-0
              group
            "
          >

            {/* Background */}
     <Image
  src={ritual.image}
  alt={ritual.title}
  fill
  sizes="
    (max-width: 768px) 280px,
    (max-width: 1280px) 50vw,
    33vw
  "
  className="
    object-cover
    transition-transform
    duration-500
    group-hover:scale-105
    pointer-events-none
  "
/>

            {/* Overlay */}
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-b
                from-black/5
                via-black/10
                to-black/20
                p-s24
                lg:p-s32
                flex
                flex-col
                justify-between
              "
            >

              {/* Top */}
              <div className="flex flex-col gap-s6">

                <h4
                  className="
                    heading-h6
                    lg:heading-h4
                    text-white
                    max-w-[90%]
                  "
                >
                  {ritual.title}
                </h4>

                <p className="body-small text-white/90">
                  {ritual.subtitle}
                </p>

              </div>

              {/* Bottom */}
              <div>

                <Button
                  variant="secondary"
                  className="
                    !bg-[#D6B15F]
                    !text-white
                    hover:opacity-90
                    backdrop-blur-md
                  "
                >
                  ▶ Watch
                </Button>

              </div>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default RecentRitualExperiences;
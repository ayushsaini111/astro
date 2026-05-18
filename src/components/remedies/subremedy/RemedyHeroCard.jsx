"use client";

import React from "react";
import Image from "next/image";

import { ArrowLeft } from "lucide-react";

function RemedyHeroCard({
  title = "Feeling mentally exhausted lately?",

  description = "Simple spiritual practices may help restore calmness and clarity.",

  image = "/Remedies/remedy-1.png",

  overlay = "from-[#7A4FB1]/40 via-[#5C2B83]/30 to-black/70",

  titleColor = "text-white",

  descriptionColor = "text-white/90",
}) {
  return (
    <section className="">

      <div
        className="
          relative

          min-h-[290px]
          lg:min-h-[340px]

          rounded-b-r40
          overflow-hidden
        "
      >

        {/* IMAGE */}
        <Image
          src={image}
          alt={title}
          fill
          priority
          className="object-cover"
        />

        {/* OVERLAY */}
        <div
          className={`
            absolute
            inset-0

            bg-gradient-to-b

            ${overlay}
          `}
        />

        {/* BACK */}
        <button
          className="
            absolute
            top-s16
            left-s16

            z-20

            w-s40
            h-s40

            rounded-full

            bg-black/10
            backdrop-blur-md

            flex
            items-center
            justify-center
          "
        >
          <ArrowLeft
            size={20}
            className="text-white"
          />
        </button>

        {/* CONTENT */}
        <div
          className="
            relative
            z-10

            h-full

            flex
            flex-col
            justify-end

            gap-s16
pt-s64 md:pt-s104
            px-s24
            lg:p-s40
          "
        >

          {/* TITLE */}
          <h1
            className={`
              heading-h3

             

              max-w-[240px]
              lg:max-w-[520px]

          

              ${titleColor}
            `}
          >
            {title}
          </h1>

          {/* DESCRIPTION */}
          <p
            className={`
             body-default

              max-w-[240px]
              lg:max-w-[520px]

              ${descriptionColor}
            `}
          >
            {description}
          </p>

        </div>

      </div>

    </section>
  );
}

export default RemedyHeroCard;
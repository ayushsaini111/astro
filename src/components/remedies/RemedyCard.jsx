"use client";

import React from "react";
import Image from "next/image";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

function RemedyCard({
  id,

  title,
  description,
  image,

  overlay = "",

  titleColor = "text-white",
  descriptionColor = "text-white/90",

  buttonBg = "bg-[#F6EDE6]",
  buttonIcon = "text-main",
}) {
  return (
    <Link
      href={`/remedies/${id}`}
      className="
        block
      "
    >

      <div
        className="
          relative
          overflow-hidden

          rounded-r40

          h-[194px]

          lg:h-[320px]

          group

          shadow-[0_10px_40px_rgba(0,0,0,0.08)]
        "
      >

        {/* IMAGE */}
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width:1024px) 100vw, 800px"
          className="
            object-cover

            transition-transform
            duration-700

            group-hover:scale-105
          "
        />

        {/* OVERLAY */}
        <div
          className={`
            absolute
            inset-0

            bg-gradient-to-r

            ${overlay}
          `}
        />

        {/* BOTTOM FADE */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0

            h-[90px]

            bg-gradient-to-t
            from-black/60
            to-transparent
          "
        />

        {/* CONTENT */}
        <div
          className="
            relative
            z-10

            h-full

            flex
            flex-col
            justify-between

            p-s16

            lg:p-s32
          "
        >

          {/* TITLE */}
          <div
            className="
              max-w-[230px]

              lg:max-w-[480px]
            "
          >

            <h2
              className={`
                font-primary
                font-semibold

                heading-h4

                lg:text-[3rem]

                leading-[1.15]

                ${titleColor}
              `}
            >
              {title}
            </h2>

          </div>

          {/* BOTTOM */}
          <div
            className="
              flex
              items-end
              justify-between

              gap-s16
            "
          >

            {/* DESCRIPTION */}
            <p
              className={`
                body-small

                lg:text-[1rem]

                leading-relaxed

                max-w-[230px]

                lg:max-w-[520px]

                ${descriptionColor}
              `}
            >
              {description}
            </p>

            {/* BUTTON */}
            <div
              className={`
                w-s40
                h-s40

                lg:w-s56
                lg:h-s56

                rounded-full

                flex
                items-center
                justify-center

                flex-shrink-0

                transition-all
                duration-300

                group-hover:scale-105

                ${buttonBg}
              `}
            >

              <ArrowRight
                size={20}
                className={buttonIcon}
              />

            </div>

          </div>

        </div>

      </div>

    </Link>
  );
}

export default RemedyCard;
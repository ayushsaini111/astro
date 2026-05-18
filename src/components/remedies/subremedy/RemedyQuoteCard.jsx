"use client";

import React from "react";

import { Quote } from "lucide-react";

function RemedyQuoteCard() {
  return (
    <section
      className="
        px-s16

        flex
        flex-col

        gap-s16
      "
    >

      {/* HEADING */}
      <h2
        className="
          heading-h5

          text-main
        "
      >
        Understanding the Feeling
      </h2>

      {/* CARD */}
      <div
        className="
          relative

          rounded-r32

          bg-[#F6EEE7]

          p-s24
        "
      >

        {/* TOP QUOTE */}
        <Quote
          size={28}
          className="
            absolute
            top-s16
            left-s16

            text-[#A18E82]

            rotate-180
          "
        />

        {/* TEXT */}
        <p
          className="
            heading-h6
            px-s32
          "
        >
            It’s normal to feel mentally
          heavy when life becomes
          overwhelming. Small calming
          routines may help restore
          emotional clarity.
        </p>

        {/* BOTTOM QUOTE */}
        <Quote
          size={28}
          className="
            absolute
            bottom-s16
            right-s16

            text-[#A18E82]
          "
        />

      </div>

    </section>
  );
}

export default RemedyQuoteCard;
"use client";

import { useRouter } from "next/navigation";

import React from "react";
import Image from "next/image";

import Button from "@/components/ui/Button";

function GuidanceSection() {
  const router = useRouter();
  return (
    <section className="px-s16 lg:px-0">

      <div
        className="
          rounded-r40

          bg-[#DFC47D]

          px-s24
          py-s24

          lg:px-s40
          lg:py-s40

          min-h-[260px]

          lg:min-h-[340px]

          flex
          flex-col
          justify-between
          gap-s40
        "
      >

        {/* TOP */}
        <div
          className="
            flex
            flex-col
            gap-s24
          "
        >

          {/* Image */}
          <div
            className="
              relative

              w-[72px]
              h-[72px]

              lg:w-[90px]
              lg:h-[90px]
            "
          >

            <Image
              src="/Ceremonies/thinking-man.png"
              alt="Guidance"
              fill
              sizes="90px"
              className="object-contain"
            />

          </div>

          {/* Heading */}
          <h2
            className="
              heading-h3
              text-main

              leading-[1.15]

              max-w-[280px]

              lg:max-w-[520px]
            "
          >
            Need guidance before booking?
          </h2>

        </div>

        {/* BOTTOM */}
        <div
          className="
            flex
            flex-col
            gap-s24
mx-auto md:mx-0
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >

          {/* Description */}
          <p
            className="
              body-default
              text-main

              leading-relaxed

              max-w-[240px]

              lg:max-w-[420px]
            "
          >
            Talk to our pandit for
            ceremony guidance and
            muhurat support
          </p>

          {/* Button */}
          <Button
            variant="primary"
            onClick={() => router.push("/consultation")}
            className="
              !rounded-r32

              !px-s24
              !py-s12

              lg:!px-s32
              lg:!py-s16

              w-fit

              text-sm
              lg:text-lg
            "
          >
            Start Consultation →
          </Button>

        </div>

      </div>

    </section>
  );
}

export default GuidanceSection;
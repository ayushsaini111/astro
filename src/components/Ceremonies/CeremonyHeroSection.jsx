"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import Button from "@/components/ui/Button";

function CeremonyHeroSection() {
  const router = useRouter();

  const handleBookCeremony = () => {
    router.push("/ceremonies/cermony");
  };

  return (
    <section className="px-s16 lg:px-0">

      <div
        className="
          relative
          overflow-hidden

          rounded-r40

          min-h-[300px]
          lg:min-h-[560px]

          bg-[#F5EEE7]

          shadow-[0_20px_60px_rgba(0,0,0,0.08)]
        "
      >

        {/* BACKGROUND IMAGE */}
        <Image
          src="/Rituals/coconut.png"
          alt="Ceremony"
          fill
          priority
          sizes="(max-width:1024px) 100vw, 1200px"
          className="
            object-cover
            object-left_40%
          "
        />

        {/* LEFT OVERLAY */}
    

        {/* CONTENT */}
        <div
          className="
            relative
            z-10

            h-full

            flex
            flex-col
            justify-between

            p-s24

            lg:p-s48
          "
        >

          {/* TOP */}
          <div
            className="
              flex
              flex-col
              gap-s24

              max-w-[240px]

             
            "
          >

            {/* HEADING */}
            <h1
              className="
              heading-h4
                text-main
              "
            >

              Arrange ceremonies at home{" "}

              <span className="text-[#8A5AB8]">
                effortlessly
              </span>

            </h1>

            {/* DESCRIPTION */}
            <p
              className="
                body-default
                text-secondary

                leading-relaxed

                max-w-[220px]

                lg:max-w-[420px]

                text-[15px]

                lg:text-[2rem]
              "
            >
              Our pandit arrives with
              complete samagri and
              takes care of everything
              at your home.
            </p>

          </div>

          {/* BUTTON */}
          <div className="pt-s24 md:pt-s40">

            <Button
              onClick={handleBookCeremony}
              variant="primary"
              className="
                !rounded-r32

                !px-s24
                !py-s12

                lg:!px-s40
                lg:!py-s24

                text-sm

                lg:text-2xl
              "
            >
              Book a Ceremony
            </Button>

          </div>

        </div>

      </div>

    </section>
  );
}

export default CeremonyHeroSection;
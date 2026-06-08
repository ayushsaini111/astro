'use client'

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Add router import
import Image from "next/image";
import Button from "@/components/ui/Button";

function UpcomingLiveRituals({
  title = "Upcoming Live Rituals",
  rituals = [],
}) {

  const sliderRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter(); // ✅ Initialize router

  const handleScroll = () => {

    if (!sliderRef.current) return;

    const scrollLeft = sliderRef.current.scrollLeft;
    const cardWidth =
      sliderRef.current.firstChild.offsetWidth + 24;

    const index = Math.round(scrollLeft / cardWidth);

    setActiveIndex(index);
  };

  // ✅ Add coming soon handler
  const handleComingSoon = () => {
    router.push("/coming-soon");
  };

  return (
    <section className="flex flex-col gap-s24 px-s16">

      {/* Heading */}
      <div className="flex items-center justify-between">

        <h3 className="heading-h5 text-main">
          {title}
        </h3>

      </div>

      {/* Slider */}
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="
          flex
          gap-s24
          overflow-x-auto
          snap-x
          snap-mandatory
          hide-scrollbar
          scroll-smooth
        "
      >

        {rituals.map((ritual, index) => (
          <div
            key={index}
            className="
              relative
              min-w-full
              lg:min-w-[720px]
              xl:min-w-[820px]
              h-[240px]
              lg:h-[380px]
              rounded-r40
              overflow-hidden
              snap-center
              flex-shrink-0
            "
          >

            {/* Background */}
            <Image
              src={ritual.image}
              alt={ritual.ritualTitle}
              fill
              sizes="(max-width: 768px) 100vw, 820px"
              className="
                object-cover
                pointer-events-none
              "
            />

            {/* Overlay */}
            <div
              className="
                absolute
                inset-0
                bg-black/20
                p-s24
                lg:p-s40
                flex
                flex-col
                justify-between
              "
            >

              {/* Top */}
              <div className="flex flex-col gap-s8">

                <span className="body-small text-[#D6B15F]">
                  {ritual.liveText}
                </span>

                <h2
                  className="
                    heading-h4
                    lg:heading-h2
                    text-white
                    max-w-[85%]
                  "
                >
                  {ritual.ritualTitle}
                </h2>

              </div>

              {/* Bottom */}
              <div className="flex items-end justify-between gap-s24">

                <p className="body-default lg:text-[1.1rem] text-white">
                  {ritual.date}
                </p>

                {/* ✅ Updated button with coming soon */}
                <Button
                  variant="primary"
                  onClick={handleComingSoon} // ✅ Add click handler
                  className="
                    !bg-[#6E2B75]
                    hover:!bg-[#7E3D86]
                    cursor-pointer
                  "
                >
                  {ritual.buttonText}
                </Button>

              </div>

            </div>

          </div>
        ))}

      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-s8">

        {rituals.map((_, index) => (
          <div
            key={index}
            className={`
              h-[8px]
              rounded-full
              transition-all
              duration-300
              ${
                activeIndex === index
                  ? "w-[20px] bg-primary-main"
                  : "w-[8px] bg-[#C7B8B1]"
              }
            `}
          />
        ))}

      </div>

    </section>
  );
}

export default UpcomingLiveRituals;
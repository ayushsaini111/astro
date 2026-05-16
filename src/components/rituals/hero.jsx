import React from "react";
import Button from "@/components/ui/Button";

function HeroCard() {
  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-r40
        min-h-[260px]
        md:min-h-[300px]
        p-s24 mx-s16
        flex
        flex-col
        justify-between
        bg-gradient-to-b
        from-[#6E2B75]
        to-[#220126]
        shadow-lg
      "
    >

      {/* Content */}
      <div className="max-w-[80%]">

        <h2 className="heading-h3 text-white leading-tight">
          Find peace, clarity,
          <br />
          and balance
        </h2>

      </div>

      {/* Bottom */}
      <div className="flex items-end justify-between gap-s24">

        <p className="body-small text-gray-300 max-w-[180px]">
          Personalized rituals by
          
          verified pandits
        </p>

        <Button
          variant="secondary"
          className="!bg-[#CDA85F] !text-white"
        >
          Explore
        </Button>

      </div>

    </section>
  );
}

export default HeroCard;

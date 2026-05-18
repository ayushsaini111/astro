import React from "react";
import Image from "next/image";
import { Shield } from 'lucide-react';
function HassleFreeSection() {
  return (
    <section className="px-s16 lg:px-0">

      <div
        className="
          bg-[#F3E8DF]

          rounded-r32

          px-s16
          py-s16

          lg:px-s32
          lg:py-s24

          flex
          items-center
          justify-between

          overflow-hidden
        "
      >

        {/* LEFT */}
        <div
          className="
            flex
            items-start
            gap-s8

            flex-1
          "
        >

          {/* ICON */}
          <div
            className="
              w-s48
              h-s48

              lg:w-s56
              lg:h-s56

              rounded-full

              bg-[#ecdaccb6]

              flex
              items-center
              justify-center

              flex-shrink-0
            "
          >

            <Shield color="#E2BE67" size={24} />

          </div>

          {/* CONTENT */}
          <div className="flex flex-col">

            <h3
              className="
                body-small
                text-main
              "
            >
              100% Hassle-Free
            </h3>

            <p
              className="
                caption
                text-secondary

                leading-relaxed

                max-w-[240px]

                lg:max-w-[420px]
              "
            >
              You don't need to arrange
              anything. We bring
              everything to your home.
            </p>

          </div>

        </div>

        {/* RIGHT IMAGE */}
        <div
  className="
    relative

    w-[100px]
    h-[100px]

    lg:w-[540px]
    lg:h-[160px]

    flex-shrink-0
  "
>

  <Image
    src="/Ceremonies/bag.png"
    alt="Pooja Samagri"
    fill
    sizes="240px"
    className="
      object-contain
      object-right
    "
  />

</div>

      </div>

    </section>
  );
}

export default HassleFreeSection;
"use client";

import React from "react";
import Image from "next/image";

import { Heart } from "lucide-react";

import Button from "@/components/ui/Button";

function ProductCard() {
  return (
    <div
      className="
        overflow-hidden
        rounded-r24
        bg-white
        border
        border-[#E8DED5]
      "
    >

      {/* IMAGE */}
      <div
        className="
          relative
          h-[170px]
          bg-[#F6F1EB]
          overflow-hidden
        "
      >

        <Image
          src="/Products/product-1.png"
          alt="Product"
          fill
          className="
            object-cover
            w-full
            h-full
          "
        />

        <button
          className="
            absolute
            top-s16
            right-s16
            w-s32
            h-s32
            rounded-full
            bg-white
            flex
            items-center
            justify-center
            shadow-sm
          "
        >
          <Heart
            size={16}
            className="text-[#8A5AB8]"
          />
        </button>

      </div>

      {/* CONTENT */}
      <div className="p-s16 flex flex-col gap-s8">

        <div className="flex flex-col gap-s6">

          <h3
            className="
              body-small
              text-main
            "
          >
            5 Mukhi Rudraksha Bracelet
          </h3>

          <p
            className="
              text-xs
              text-secondary
              leading-relaxed
            "
          >
            For peace and prosperity
          </p>

        </div>

        <div className="flex items-center justify-between">

          <span
            className="
              text-sm
              font-semibold
              text-main
            "
          >
            ₹499
          </span>

          <Button
            variant="primary"
            className="
              !h-s36
              !px-s16
              text-xs
            "
          >
            Buy
          </Button>

        </div>

      </div>

    </div>
  );
}

export default ProductCard;
"use client";

import React from "react";

import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Heart,
} from "lucide-react";

import { useRouter } from "next/navigation";

function ProductsHeader({
  title = "All Products",
  showTabs = false,
  tabs = [],
  activeTab = "All",
}) {
  const router = useRouter();

  return (
    <header
      className="
        flex
        flex-col
        gap-s24

        px-s16
        pt-s16

        lg:px-s32
        lg:pt-s24
      "
    >

      {/* TOP BAR */}
      <div className="flex items-center justify-between">

        <button
          onClick={() => router.back()}
          className="
            w-s40
            h-s40

            rounded-full

            flex
            items-center
            justify-center
          "
        >
          <ArrowLeft
            size={22}
            className="text-main"
          />
        </button>

        <h1
          className="
            heading-h4
            lg:text-[40px]

            text-main
          "
        >
          {title}
        </h1>

        <button
          className="
            w-s40
            h-s40

            lg:w-s48
            lg:h-s48

            rounded-full

            border
            border-[#D8C3E0]

            flex
            items-center
            justify-center

            bg-[#F5EEE7]
          "
        >
          <Heart
            size={18}
            className="text-[#8A5AB8]"
          />
        </button>

      </div>

      {/* SEARCH */}
      <div className="flex gap-s16">

        <div
          className="
            flex-1

            h-s48
            lg:h-s56

            rounded-full

            border
            border-[#BFAE9D]

            bg-[#F7EFE8]

            px-s16

            flex
            items-center
            gap-s8
          "
        >

          <Search
            size={18}
            className="text-secondary"
          />

          <input
            type="text"
            placeholder="Search products..."
            className="
              flex-1

              bg-transparent
              outline-none

              text-sm
              lg:text-base

              placeholder:text-secondary
            "
          />

        </div>

        <button
          className="
            w-s48
            h-s48

            lg:w-s56
            lg:h-s56

            rounded-full

            border
            border-[#BFAE9D]

            flex
            items-center
            justify-center

            bg-[#F7EFE8]
          "
        >
          <SlidersHorizontal
            size={18}
            className="text-main"
          />
        </button>

      </div>

      {/* TABS */}
      {showTabs && (
        <div
          className="
            flex
            items-center
            gap-s8

            overflow-x-auto
            hide-scrollbar
          "
        >

          {tabs.map((tab) => (
            <button
              key={tab}
              className={`
                px-s16
                py-s8

                rounded-full

                whitespace-nowrap

                text-sm
                lg:text-base

                transition-all

                ${
                  activeTab === tab
                    ? "bg-[#8A5AB8] text-white"
                    : "bg-[#F2E7DE] text-secondary"
                }
              `}
            >
              {tab}
            </button>
          ))}

        </div>
      )}

    </header>
  );
}

export default ProductsHeader;
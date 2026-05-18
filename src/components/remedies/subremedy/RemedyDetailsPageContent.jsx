"use client";

import React from "react";

import RemedyHeroCard from "./RemedyHeroCard";

import RemedyQuoteCard from "./RemedyQuoteCard";

import Recommendation from "@/components/Ceremonies/Recommendation";

import ProductCard from "@/components/products/ProductCard";

import GuidanceSection from "@/components/Ceremonies/GuidanceSection";

import { useRouter } from "next/navigation";

const rituals = [
  {
    id: 1,
    title: "Career Growth Pooja",
    description:
    "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/ganeshji.jpg",
  },
  
  {
    id: 2,
    title: "Wealth Ritual",
    description:
    "Attract abundance and positive energy.",
    image: "/Rituals/diya.jpg",
  },
  {
    id: 2,
    title: "Wealth Ritual",
    description:
    "Attract abundance and positive energy.",
    image: "/Rituals/diya2.jpg",
  },
];

function RemedyDetailsPageContent({
  remedy,
}) {
  /* FALLBACK */
  const router = useRouter();
  const safeRemedy =
  remedy || {
    title:
    "Feeling mentally exhausted lately?",
    
    description:
        "Simple spiritual practices may help restore calmness and clarity.",

      image:
        "/Remedies/remedy-1.png",

      overlay:
        "from-[#5C2D79]/80 via-[#5C2D79]/30 to-transparent",

      titleColor: "text-white",

      descriptionColor:
        "text-white/90",
    };

  return (
    <main
      className="
        min-h-screen

      max-w-7xl mx-auto

        flex
        flex-col

        gap-s32

        pb-[120px]
      "
    >

      {/* HERO */}
      <RemedyHeroCard
        title={safeRemedy.title}
        description={
          safeRemedy.description
        }
        image={safeRemedy.image}
        overlay={safeRemedy.overlay}
        titleColor={
          safeRemedy.titleColor
        }
        descriptionColor={
          safeRemedy.descriptionColor
        }
      />

      {/* QUOTE */}
      <RemedyQuoteCard />

      {/* RITUALS */}
      <Recommendation
        sectionTitle="Suggested Rituals"
        actionText="View All"
        rituals={rituals}
      />

      {/* PRODUCTS */}
      <section
        className="
          flex
          flex-col

          gap-s24
        "
      >

        {/* HEADER */}
        <div
          className="
            flex
            items-center
            justify-between

            px-s16
          "
        >

          <h2
            className="
              heading-h5

              text-main
            "
          >
            Supportive Spiritual Tools
          </h2>

     <button
  onClick={() =>
    router.push("/allproducts")
  }
  className="
    text-primary-light

    text-[14px]
    font-medium
  "
>
  View All
</button>

        </div>

        {/* PRODUCTS */}
        <div
          className="
            flex

            gap-s16

            overflow-x-auto
            hide-scrollbar

            px-s16
          "
        >

          <div className="min-w-[170px]">
            <ProductCard />
          </div>

          <div className="min-w-[170px]">
            <ProductCard />
          </div>

        </div>

      </section>

      {/* GUIDANCE */}
      <GuidanceSection />

    </main>
  );
}

export default RemedyDetailsPageContent;
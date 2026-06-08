"use client";

import React from "react";
import Image from "next/image";
import RemedyHeroCard from "./RemedyHeroCard";
import RemedyQuoteCard from "./RemedyQuoteCard";
import Recommendation from "@/components/Ceremonies/Recommendation";
import ProductCard from "@/components/products/ProductCard";
import GuidanceSection from "@/components/Ceremonies/GuidanceSection";
import { useRouter } from "next/navigation";
import { ALL_PRODUCTS } from "@/data/products";

const rituals = [
  {
    id: 1,
    title: "Career Growth Pooja",
    description: "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/ganeshji.jpg",
  },
  {
    id: 2,
    title: "Wealth Ritual",
    description: "Attract abundance and positive energy.",
    image: "/Rituals/diya.jpg",
  },
  {
    id: 3,
    title: "Peace Blessing",
    description: "Restore calmness and mental clarity.",
    image: "/Rituals/diya2.jpg",
  },
];

// ✅ Get sample products
const sampleProducts = ALL_PRODUCTS?.slice(0, 4) || [];

function RemedyDetailsPageContent({ remedy }) {
  const router = useRouter();

  /* FALLBACK */
  const safeRemedy = remedy || {
    title: "Feeling mentally exhausted lately?",
    description: "Simple spiritual practices may help restore calmness and clarity.",
    image: "/Remedies/remedy-1.png",
    overlay: "from-[#5C2D79]/80 via-[#5C2D79]/30 to-transparent",
    titleColor: "text-white",
    descriptionColor: "text-white/90",
  };

  // ✅ Handle ritual click
  const handleRitualClick = (ritualId) => {
    router.push(`/rituals/${ritualId}`);
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
        description={safeRemedy.description}
        image={safeRemedy.image}
        overlay={safeRemedy.overlay}
        titleColor={safeRemedy.titleColor}
        descriptionColor={safeRemedy.descriptionColor}
      />

      {/* QUOTE */}
      <RemedyQuoteCard />

      {/* RITUALS - ✅ Replace Recommendation with custom clickable cards */}
      <section className="px-s16 flex flex-col gap-s24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="heading-h5 text-main">Suggested Rituals</h2>
          <button
            onClick={() => router.push("/ritualPackages")}
            className="text-primary-light text-[14px] font-medium hover:underline transition-colors"
          >
            View All →
          </button>
        </div>

        {/* Clickable Rituals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-s16">
          {rituals.map((ritual) => (
            <div
              key={ritual.id}
              onClick={() => handleRitualClick(ritual.id)}
              className="
                group cursor-pointer
                overflow-hidden rounded-r24 
                bg-white border border-[#E8DED5]
                hover:shadow-lg hover:border-[#C39BD3]
                transition-all duration-300
                transform hover:-translate-y-1
              "
            >
              {/* Image */}
              <div className="relative h-[180px] bg-[#F6F1EB] overflow-hidden">
                <Image
                  src={ritual.image}
                  alt={ritual.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Book Now Badge */}
                <div className="absolute top-s16 right-s16 bg-primary-main text-white px-s16 py-s6 rounded-r16 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Book Now
                </div>
              </div>

              {/* Content */}
              <div className="p-s16 space-y-s8">
                <h3 className="body-default font-semibold text-main group-hover:text-primary-main transition-colors">
                  {ritual.title}
                </h3>
                <p className="body-small text-secondary line-clamp-2 leading-relaxed">
                  {ritual.description}
                </p>
                
                {/* Learn More indicator */}
                <div className="flex items-center gap-s4 text-primary-light opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
                  <span className="text-xs font-medium">Learn More</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="flex flex-col gap-s24">
        {/* HEADER */}
        <div className="flex items-center justify-between px-s16">
          <h2 className="heading-h5 text-main">
            Supportive Spiritual Tools
          </h2>

          <button
            onClick={() => router.push("/allproducts")}
            className="text-primary-light text-[14px] font-medium hover:underline transition-colors"
          >
            View All →
          </button>
        </div>

        {/* PRODUCTS - ✅ Updated with actual product data */}
        <div className="flex gap-s16 overflow-x-auto hide-scrollbar px-s16">
          {sampleProducts.length > 0 ? (
            sampleProducts.map((product) => (
              <div key={product.id} className="min-w-[170px]">
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            // Fallback for no products
            <>
              <div className="min-w-[170px]">
                <div className="bg-gray-100 rounded-r24 h-[250px] flex items-center justify-center">
                  <p className="body-small text-secondary">No products available</p>
                </div>
              </div>
              <div className="min-w-[170px]">
                <div className="bg-gray-100 rounded-r24 h-[250px] flex items-center justify-center">
                  <p className="body-small text-secondary">No products available</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* GUIDANCE */}
      <GuidanceSection />
    </main>
  );
}

export default RemedyDetailsPageContent;
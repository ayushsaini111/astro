"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

const slides = [
  {
    id: 1,
    title: "Sacred items for a positive life",
    description: "Curated with purity and devotion for your spiritual journey.",
    image: "/Products/hero.png",
  },
  {
    id: 2,
    title: "Bring divine energy to your home",
    description: "Authentic spiritual essentials handcrafted with care.",
    image: "/Products/hero.png",
  },
  {
    id: 3,
    title: "Spiritual collection made with care",
    description: "Crafted for peace, prosperity and positive vibrations.",
    image: "/Products/hero.png",
  },
];

function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const slider = setInterval(() => {
      setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(slider);
  }, []);

  const scrollToProducts = () => {
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="px-s16 lg:px-s24">
      <div className="relative overflow-hidden rounded-r40 min-h-[260px] lg:min-h-[520px] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        
        {/* BACKGROUND IMAGE */}
        <div className="absolute inset-0">
          <Image
            key={activeSlide}
            src={slides[activeSlide].image}
            alt="Hero Banner"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center transition-all duration-700"
          />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 h-full flex flex-col justify-between p-s24 lg:p-s48">
          <div className="max-w-[220px] lg:max-w-[540px] flex flex-col gap-s16 lg:gap-s24">
            
            <h1 className="heading-h4 lg:text-[4rem] text-main leading-[110%]">
              {slides[activeSlide].title}
            </h1>

            <p className="body-small text-secondary leading-relaxed max-w-[220px] lg:max-w-[520px] lg:text-xl">
              {slides[activeSlide].description}
            </p>

            <Button
              variant="primary"
              onClick={scrollToProducts}
              className="w-fit !rounded-r32 !px-s24 !py-s12 lg:!px-s32 lg:!py-s18 lg:text-lg"
            >
              Shop Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
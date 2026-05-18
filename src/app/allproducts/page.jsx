import React from "react";

import ProductsHeader from "@/components/ProductsHeader";
import CeremonyHeroSection from "@/components/products/HeroSection";
import ProductsSection from "@/components/products/ProductsSection";

export default function ProductsPage() {
  return (
    <main
      className="
        min-h-screen
         max-w-7xl
        flex mx-auto
        flex-col
        gap-s32
        pb-s40
      "
    >

      
            {/* HEADER */}
            <ProductsHeader
              title="All Products"
              showTabs={true}
              tabs={[
                "All",
                "Rudraksha",
                "Gemstones",
                "Bracelets",
              ]}
              activeTab="All"
            />

      <CeremonyHeroSection />

      <ProductsSection />

    </main>
  );
}
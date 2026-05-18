import React from "react";

import ProductsHeader from "@/components/ProductsHeader";

import RitualPackagesGrid from "@/components/RitualPackages/RitualPackagesGrid";

const rituals = [
  {
    id: 1,
    title: "Career Growth Pooja",
    description:
      "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/diya2.jpg",
  },

  {
    id: 2,
    title: "Career Growth Pooja",
    description:
      "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/ganeshji.jpg",
  },

  {
    id: 3,
    title: "Career Growth Pooja",
    description:
      "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/ganeshji.jpg",
  },

  {
    id: 4,
    title: "Career Growth Pooja",
    description:
      "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/diya.jpg",
  },

  {
    id: 5,
    title: "Career Growth Pooja",
    description:
      "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/diya.jpg",
  },

  {
    id: 6,
    title: "Career Growth Pooja",
    description:
      "Enhance focus, remove obstacles and attract new opportunities.",
    image: "/Rituals/ganeshji.jpg",
  },
];

export default function RitualPackagesPage() {
  return (
    <main
      className="
        min-h-screen

      max-w-7xl
      mx-auto

        flex
        flex-col

        gap-s32

        pb-[120px]
      "
    >

      {/* HEADER */}
      <ProductsHeader
        title="Ritual Packages"
        showTabs={true}
        tabs={[
          "All",
          "Rudraksha",
          "Gemstones",
          "Bracelets",
        ]}
        activeTab="All"
      />

      {/* GRID */}
      <RitualPackagesGrid
        sectionTitle="All Packages"
        rituals={rituals}
      />

    </main>
  );
}
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  ShoppingBag,
  ArrowRight,
  MapPin,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ALL_CEREMONIES, CEREMONY_CATEGORIES } from "@/data/ceremonies";

function CeremonySection() {
  const router = useRouter();
  
  // Filter & Sort state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [showFilters, setShowFilters] = useState(false);

  // Location state
  const [selectedLocation, setSelectedLocation] = useState("Kanpur, Uttar Pradesh");

  // ✅ Filter and sort ceremonies
  const filteredCeremonies = useMemo(() => {
    let filtered = ALL_CEREMONIES;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "popularity":
      default:
        break; // Keep original order
    }

    return sorted;
  }, [selectedCategory, searchQuery, sortBy]);

  const handleGoBack = () => {
    router.back();
  };

  const handleCeremonyClick = (ceremonyId) => {
    router.push(`/ceremonies/cermony/${ceremonyId}`);
  };

  const hasActiveFilters = selectedCategory !== "All" || searchQuery;

  return (
    <>
      {/* ─── HEADER SECTION ─── */}
      <section
        className="
          flex
          flex-col
          max-w-7xl mx-auto
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
            onClick={handleGoBack}
            type="button"
            className="
              w-s40
              h-s40

              rounded-full

              flex
              items-center
              justify-center
              hover:bg-black/5
              transition-colors
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

              text-main
            "
          >
            Ceremonies
          </h1>

          <button
            type="button"
            className="
              w-s40
              h-s40

              rounded-full

              border
              border-[#D8C3E0]

              bg-[#F8F0EA]

              flex
              items-center
              justify-center
              hover:bg-[#F0E3DC]
              transition-colors
            "
          >
            <ShoppingBag
              size={18}
              className="text-[#8A5AB8]"
            />
          </button>

        </div>

        {/* CONTENT */}
        <div
          className="
            flex
            flex-col
            items-center

            gap-s16
          "
        >

          {/* TEXT */}
          <div
            className="
              flex
              flex-col
              items-center

              gap-s8
            "
          >

            <p
              className="
                text-center

                text-secondary

               body-default

                max-w-[280px]
              "
            >
              Sacred ceremonies for life's
              special moments
            </p>

          </div>

          {/* LOCATION */}
          <button
            type="button"
            className="
              h-s48

              px-s24

              rounded-full

              border
              border-[#BFAE9D]

              bg-[#F8F0EA]

              flex
              items-center
              gap-s8

              shadow-[0_10px_30px_rgba(0,0,0,0.04)]

              transition-all
              duration-300

              hover:scale-[1.02]
            "
          >

            <MapPin
              size={18}
              className="text-main"
            />

            <span
              className="
                text-[15px]
                lg:text-[16px]

                text-main

                font-medium
              "
            >
              {selectedLocation}
            </span>

            <ChevronDown
              size={18}
              className="text-main"
            />

          </button>

        </div>

      </section>

      {/* ─── SEARCH & FILTER BAR ─── */}
      <section className="px-s16 lg:px-s32 max-w-7xl mx-auto mt-s32">
        
        {/* Search Bar */}
        <div className="flex gap-s16">
          <div className="flex-1 h-s48 rounded-full border border-[#BFAE9D] bg-[#F8F0EA] px-s16 flex items-center gap-s8 focus-within:border-[#9B59B6]">
            <Search size={18} className="text-secondary flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ceremonies..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-secondary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                type="button"
                className="p-1 hover:bg-black/5 rounded-full"
              >
                <X size={16} className="text-secondary" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            type="button"
            className={`
              w-s48 h-s48 rounded-full border flex items-center justify-center transition-all
              ${showFilters || hasActiveFilters
                ? "bg-[#9B59B6] border-[#9B59B6] text-white"
                : "border-[#BFAE9D] bg-[#F8F0EA] text-main hover:bg-[#F0E3DC]"
              }
            `}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-s8 flex-wrap mt-s16">
            <span className="text-sm text-secondary">Active filters:</span>
            
            {selectedCategory !== "All" && (
              <div className="flex items-center gap-s4 px-s16 py-s8 bg-[#9B59B6]/10 rounded-full">
                <span className="text-sm text-[#9B59B6]">{selectedCategory}</span>
                <button
                  onClick={() => setSelectedCategory("All")}
                  type="button"
                  className="p-1 hover:bg-[#9B59B6]/20 rounded-full"
                >
                  <X size={12} className="text-[#9B59B6]" />
                </button>
              </div>
            )}

            {searchQuery && (
              <div className="flex items-center gap-s4 px-s16 py-s8 bg-[#9B59B6]/10 rounded-full">
                <span className="text-sm text-[#9B59B6]">"{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery("")}
                  type="button"
                  className="p-1 hover:bg-[#9B59B6]/20 rounded-full"
                >
                  <X size={12} className="text-[#9B59B6]" />
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              type="button"
              className="text-sm text-[#9B59B6] hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-s16 bg-[#F8F0EA] rounded-r20 p-s16 border border-[#E0D4E3]">
            <div className="flex flex-col gap-s16">
              
              {/* Category Filter */}
              <div>
                <h4 className="body-small font-medium text-main mb-s16">Category</h4>
                <div className="flex flex-wrap gap-s8">
                  {CEREMONY_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      type="button"
                      className={`px-s16 py-s8 rounded-full text-sm font-medium transition-all ${
                        selectedCategory === cat
                          ? "bg-[#9B59B6] text-white"
                          : "bg-white border border-[#E0D4E3] text-main hover:border-[#9B59B6]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <h4 className="body-small font-medium text-main mb-s16">Sort by</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-s16 py-s8 border border-[#E0D4E3] rounded-r12 bg-white text-sm focus:outline-none focus:border-[#9B59B6]"
                >
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              <div className="flex gap-s16">
                <button
                  onClick={() => setShowFilters(false)}
                  type="button"
                  className="flex-1 px-s16 py-s8 border border-[#E0D4E3] rounded-r16 text-main font-medium hover:bg-white transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                    setSortBy("popularity");
                    setShowFilters(false);
                  }}
                  type="button"
                  className="flex-1 px-s16 py-s8 bg-[#9B59B6] text-white rounded-r16 font-medium hover:bg-[#8A4BA3] transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Info */}
        <div className="flex items-center justify-between mt-s24">
          <h2 className="heading-h5 text-main">
            {selectedCategory === "All" ? "All Ceremonies" : selectedCategory}
          </h2>
          <span className="body-small text-secondary">
            {filteredCeremonies.length} ceremony{filteredCeremonies.length !== 1 ? "s" : ""}
          </span>
        </div>

      </section>

      {/* ─── CEREMONIES GRID ─── */}
     {/* ─── CEREMONIES GRID ─── */}
<section className="px-s16 lg:px-s32 max-w-7xl mx-auto mt-s24 pb-s40">
  {filteredCeremonies.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-s64 text-center">
      <div className="w-20 h-20 rounded-full bg-[#F3EAF5] flex items-center justify-center mb-s16">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9B59B6"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      <h3 className="heading-h5 text-main mb-s8">
        No ceremonies found
      </h3>

      <p className="body-default text-secondary mb-s16">
        Try adjusting your filters or search query
      </p>

      <button
        onClick={() => {
          setSelectedCategory("All");
          setSearchQuery("");
        }}
        type="button"
        className="
          px-s24
          py-s8
          bg-[#9B59B6]
          text-white
          rounded-r16
          font-medium
          hover:bg-[#8A4BA3]
          transition-colors
        "
      >
        Clear Filters
      </button>
    </div>
  ) : (
    <div
      className="
        grid
        grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-x-s16
        gap-y-s32
      "
    >
      {filteredCeremonies.map((ceremony) => (
        <div
          key={ceremony.id}
          className="
            flex
            flex-col
            gap-s14
            group
            cursor-pointer
          "
        >
          {/* IMAGE */}
          <div
            onClick={() => handleCeremonyClick(ceremony.id)}
            className="
              relative
              w-full
              aspect-[1/0.72]
              rounded-r24
              overflow-hidden
              bg-[#EDE2D8]
            "
          >
            <Image
              src={ceremony.image}
              alt={ceremony.title}
              fill
              sizes="
                (max-width:768px) 50vw,
                (max-width:1280px) 33vw,
                25vw
              "
              className="
                object-cover
                transition-transform
                duration-700
                group-hover:scale-105
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/30
                via-black/5
                to-transparent
              "
            />
          </div>

          {/* CONTENT */}
          <div className="flex flex-col gap-s8">
            <h4
              className="
                text-[15px]
                lg:text-[20px]
                font-semibold
                text-main
                leading-[130%]
              "
            >
              {ceremony.title}
            </h4>

            <p
              className="
                text-[13px]
                lg:text-base
                text-secondary
                leading-relaxed
                line-clamp-2
              "
            >
              {ceremony.description}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCeremonyClick(ceremony.id);
              }}
              type="button"
              className="
                group/link
                flex
                items-center
                gap-s4
                text-[14px]
                font-medium
                text-primary-light
                mt-s2
                hover:opacity-80
                transition-opacity
                duration-200
              "
            >
              Learn More

              <ArrowRight
                size={14}
                className="
                  transition-transform
                  duration-300
                  group-hover/link:translate-x-1
                "
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
    </>
  );
}

export default CeremonySection;
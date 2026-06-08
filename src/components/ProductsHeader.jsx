"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ProductsHeader({
  title = "All Products",
  subtitle,
  showSubtitle = false,
  searchPlaceholder = "Search products...",
  searchValue = "",
  showFilters = false,
  setShowFilters,
  hasActiveFilters = false,
  currentCategory = "All",
  onCategoryChange,
  categories = [],
  currentSort = "popularity",
  onSortChange,
  onClearAll,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchValue);

  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    
    router.push(`?${params.toString()}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchValue) {
        handleSearch(searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  return (
    <header className="flex flex-col gap-s24 px-s16 pt-s16 lg:px-s32 lg:pt-s24">
      
      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-s40 h-s40 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
        >
          <ArrowLeft size={22} className="text-main" />
        </button>

        <div className="text-center">
          <h1 className="heading-h4 lg:text-[40px] text-main">{title}</h1>
          {showSubtitle && subtitle && (
            <p className="text-secondary text-sm mt-1">{subtitle}</p>
          )}
        </div>

        {/* Empty spacer for alignment */}
        <div className="w-s40 h-s40" />
      </div>

      {/* SEARCH BAR */}
      <div className="flex gap-s16">
        <div className="flex-1 h-s48 lg:h-s56 rounded-full border border-[#BFAE9D] bg-[#F7EFE8] px-s16 flex items-center gap-s8 focus-within:border-[#8A5AB8]">
          <Search size={18} className="text-secondary" />
          
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm lg:text-base placeholder:text-secondary"
          />
          
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
            >
              <X size={14} className="text-secondary" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            w-s48 h-s48 lg:w-s56 lg:h-s56 rounded-full border 
            flex items-center justify-center transition-all
            ${showFilters || hasActiveFilters 
              ? "bg-[#8A5AB8] border-[#8A5AB8]" 
              : "border-[#BFAE9D] bg-[#F7EFE8] hover:bg-[#F0E3DC]"
            }
          `}
        >
          <SlidersHorizontal 
            size={18} 
            className={showFilters || hasActiveFilters ? "text-white" : "text-main"} 
          />
        </button>
      </div>

      {/* ACTIVE FILTERS INDICATOR */}
      {hasActiveFilters && (
        <div className="flex items-center gap-s8 flex-wrap">
          <span className="text-sm text-secondary">Active filters:</span>
          
          {searchInput && (
            <div className="flex items-center gap-s4 px-s16 py-s8 bg-[#8A5AB8]/10 rounded-full">
              <span className="text-sm text-[#8A5AB8]">"{searchInput}"</span>
              <button
                onClick={() => setSearchInput("")}
                className="p-1 hover:bg-[#8A5AB8]/20 rounded-full"
              >
                <X size={12} className="text-[#8A5AB8]" />
              </button>
            </div>
          )}
          
          {currentCategory !== "All" && (
            <div className="flex items-center gap-s4 px-s16 py-s8 bg-[#8A5AB8]/10 rounded-full">
              <span className="text-sm text-[#8A5AB8]">{currentCategory}</span>
              <button
                onClick={() => onCategoryChange("All")}
                className="p-1 hover:bg-[#8A5AB8]/20 rounded-full"
              >
                <X size={12} className="text-[#8A5AB8]" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="bg-[#F7EFE8] rounded-r20 p-s16 border border-[#E0D4E3]">
          <div className="flex flex-col gap-s16">
            
            {/* Category Filter */}
            <div>
              <h4 className="body-small font-medium text-main mb-s16">Category</h4>
              <div className="flex flex-wrap gap-s8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategoryChange(cat)}
                    type="button"
                    className={`px-s16 py-s8 rounded-full text-sm font-medium transition-all ${
                      currentCategory === cat
                        ? "bg-[#8A5AB8] text-white"
                        : "bg-white border border-[#E0D4E3] text-main hover:border-[#8A5AB8]"
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
                value={currentSort}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full px-s16 py-s8 border border-[#E0D4E3] rounded-r12 bg-white text-sm focus:outline-none focus:border-[#8A5AB8]"
              >
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-s16">
              <button
                onClick={() => setShowFilters(false)}
                type="button"
                className="flex-1 px-s16 py-s8 border border-[#E0D4E3] rounded-r16 text-main font-medium hover:bg-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={onClearAll}
                type="button"
                className="flex-1 px-s16 py-s8 bg-[#8A5AB8] text-white rounded-r16 font-medium hover:bg-[#7A4AA8] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default ProductsHeader;
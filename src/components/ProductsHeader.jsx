"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Heart,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ProductsHeader({
  title = "All Products",
  subtitle,
  showSubtitle = false,
  showTabs = false,
  tabs = [],
  activeTab = "All",
  searchPlaceholder = "Search products...",
  searchValue = "",
  currentParams = {},
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchValue);
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Handle tab click
  const handleTabClick = (tab) => {
    const params = new URLSearchParams(searchParams);
    
    if (tab === "All") {
      params.delete("category");
    } else {
      params.set("category", tab);
    }
    
    router.push(`?${params.toString()}`);
  };

  // ✅ Handle search
  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    
    router.push(`?${params.toString()}`);
  };

  // ✅ Clear all filters
  const clearAllFilters = () => {
    setSearchInput("")
    router.push(window.location.pathname);
  };

  // ✅ Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchValue) {
        handleSearch(searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✅ Check if any filters are active
  const hasActiveFilters = searchInput || activeTab !== "All";

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

        <button className="w-s40 h-s40 lg:w-s48 lg:h-s48 rounded-full border border-[#D8C3E0] flex items-center justify-center bg-[#F5EEE7] hover:bg-[#F0E3DC] transition-colors">
          <Heart size={18} className="text-[#8A5AB8]" />
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="flex gap-s16">
        <div className="flex-1 h-s48 lg:h-s56 rounded-full border border-[#BFAE9D] bg-[#F7EFE8] px-s16 flex items-center gap-s8">
          <Search size={18} className="text-secondary" />
          
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm lg:text-base placeholder:text-secondary"
          />
          
          {/* Clear search */}
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
            w-s48 h-s48 lg:w-s56 lg:h-s56 rounded-full border border-[#BFAE9D] 
            flex items-center justify-center transition-colors
            ${showFilters || hasActiveFilters 
              ? "bg-[#8A5AB8] border-[#8A5AB8]" 
              : "bg-[#F7EFE8] hover:bg-[#F0E3DC]"
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
          
          {activeTab !== "All" && (
            <div className="flex items-center gap-s8 px-s16 py-s8 bg-[#8A5AB8]/10 rounded-full">
              <span className="text-sm text-[#8A5AB8]">{activeTab}</span>
              <button
                onClick={() => handleTabClick("All")}
                className="p-1 hover:bg-[#8A5AB8]/20 rounded-full"
              >
                <X size={12} className="text-[#8A5AB8]" />
              </button>
            </div>
          )}
          
          {/* <button
            onClick={clearAllFilters}
            className="text-sm text-[#8A5AB8] hover:underline"
          >
            Clear All
          </button> */}
        </div>
      )}

      {/* TABS */}
      {showTabs && (showFilters || !hasActiveFilters) && (
        <div className="flex items-center gap-s8 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`
                px-s16 py-s8 rounded-full whitespace-nowrap text-sm lg:text-base transition-all
                ${
                  activeTab === tab
                    ? "bg-[#8A5AB8] text-white shadow-sm"
                    : "bg-[#F2E7DE] text-secondary hover:bg-[#E8D5CC]"
                }
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* FILTER PANEL (Optional Advanced Filters) */}
      {showFilters && hasActiveFilters && (
        <div className="bg-[#F7EFE8] rounded-r24 p-s16 border border-[#BFAE9D]">
          <div className="flex items-center justify-between mb-s12">
            <h3 className="text-sm font-medium text-main">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-black/10 rounded-full"
            >
              <X size={16} className="text-secondary" />
            </button>
          </div>
          
          <div className="text-sm text-secondary">
            {searchInput && `Search: "${searchInput}"`}
            {searchInput && activeTab !== "All" && " • "}
            {activeTab !== "All" && `Category: ${activeTab}`}
          </div>
        </div>
      )}
    </header>
  );
}

export default ProductsHeader;
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductsHeader from "@/components/ProductsHeader";
import RitualPackagesGrid from "@/components/RitualPackages/RitualPackagesGrid";
import { ALL_RITUALS, CATEGORIES } from "@/data/rituals";

export default function RitualPackagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filteredRituals, setFilteredRituals] = useState(ALL_RITUALS);
  const [showFilters, setShowFilters] = useState(false);
  
  // ✅ Get current filters from URL
  const currentCategory = searchParams.get("category") || "All";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "popularity";

  // ✅ Filter and sort rituals based on URL params
  useEffect(() => {
    let filtered = [...ALL_RITUALS];

    // Apply category filter
    if (currentCategory !== "All") {
      filtered = filtered.filter(ritual => ritual.category === currentCategory);
    }

    // Apply search filter
    if (currentSearch) {
      const searchLower = currentSearch.toLowerCase();
      filtered = filtered.filter(ritual =>
        ritual.title.toLowerCase().includes(searchLower) ||
        ritual.description.toLowerCase().includes(searchLower) ||
        ritual.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    switch (currentSort) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        filtered.sort((a, b) => b.id - a.id);
        break;
      case "popularity":
      default:
        break;
    }

    setFilteredRituals(filtered);
  }, [currentCategory, currentSearch, currentSort]);

  // ✅ Handle category change
  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams);
    
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    
    router.push(`?${params.toString()}`);
  };

  // ✅ Handle sort change
  const handleSortChange = (sortValue) => {
    const params = new URLSearchParams(searchParams);
    
    if (sortValue === "popularity") {
      params.delete("sort");
    } else {
      params.set("sort", sortValue);
    }
    
    router.push(`?${params.toString()}`);
  };

  // ✅ Clear all filters
  const clearAllFilters = () => {
    router.push(window.location.pathname);
    setShowFilters(false);
  };

  const hasActiveFilters = currentCategory !== "All" || currentSearch;

  return (
    <main className="min-h-screen max-w-7xl mx-auto flex flex-col gap-s32 pb-[120px]">
      
      {/* HEADER */}
      <ProductsHeader
        title="Ritual Packages"
        subtitle={`${filteredRituals.length} online spiritual services available`}
        showSubtitle={true}
        searchPlaceholder="Search rituals, mantras, poojas..."
        searchValue={currentSearch}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        hasActiveFilters={hasActiveFilters}
        currentCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
        categories={CATEGORIES}
        currentSort={currentSort}
        onSortChange={handleSortChange}
        onClearAll={clearAllFilters}
      />

      {/* RESULTS INFO */}
      {filteredRituals.length > 0 && (
        <div className="flex items-center justify-between px-s16 lg:px-s32">
          <div>
           
          </div>
          <span className="body-small text-secondary">
            {filteredRituals.length} ritual{filteredRituals.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* GRID */}
      <RitualPackagesGrid
        sectionTitle={getGridTitle(currentCategory, currentSearch, filteredRituals.length)}
        rituals={filteredRituals}
        showEmptyState={filteredRituals.length === 0}
        emptyStateProps={{
          category: currentCategory,
          search: currentSearch,
          onClearFilters: clearAllFilters
        }}
      />
    </main>
  );
}

// ✅ Helper function for grid title
function getGridTitle(category, search, count) {
  if (search && category !== "All") {
    return `"${search}" in ${category}`;
  } else if (search) {
    return `Search results for "${search}"`;
  } else if (category !== "All") {
    return `${category} Rituals`;
  } else {
    return "All Packages";
  }
}
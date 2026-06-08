"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import ProductsHeader from "@/components/ProductsHeader";
import HeroSection from "@/components/products/HeroSection";
import ProductsSection from "@/components/products/ProductsSection";

import { ALL_PRODUCTS, PRODUCT_CATEGORIES } from "@/data/products";

export default function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filteredProducts, setFilteredProducts] = useState(ALL_PRODUCTS);
  const [showFilters, setShowFilters] = useState(false);

  const currentCategory = searchParams.get("category") || "All";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "popularity";

  useEffect(() => {
    let filtered = [...ALL_PRODUCTS];

    if (currentCategory !== "All") {
      filtered = filtered.filter(
        (product) => product.category === currentCategory
      );
    }

    if (currentSearch) {
      const searchLower = currentSearch.toLowerCase();

      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
      );
    }

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

      default:
        filtered.sort((a, b) => b.reviews - a.reviews);
    }

    setFilteredProducts(filtered);
  }, [currentCategory, currentSearch, currentSort]);

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams.toString());

    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (sortValue) => {
    const params = new URLSearchParams(searchParams.toString());

    if (sortValue === "popularity") {
      params.delete("sort");
    } else {
      params.set("sort", sortValue);
    }

    router.push(`?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push("/allproducts");
    setShowFilters(false);
  };

  const hasActiveFilters =
    currentCategory !== "All" || currentSearch;

  return (
    <main className="min-h-screen max-w-7xl flex mx-auto flex-col gap-s32 pb-s40">
      <ProductsHeader
        title="All Products"
        subtitle={`${filteredProducts.length} products available`}
        showSubtitle
        searchPlaceholder="Search products..."
        searchValue={currentSearch}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        hasActiveFilters={hasActiveFilters}
        currentCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
        categories={PRODUCT_CATEGORIES}
        currentSort={currentSort}
        onSortChange={handleSortChange}
        onClearAll={clearAllFilters}
      />

      <HeroSection />

      <ProductsSection
        products={filteredProducts}
        currentCategory={currentCategory}
        currentSearch={currentSearch}
        onClearFilters={clearAllFilters}
      />
    </main>
  );
}
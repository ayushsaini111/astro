"use client";

import React from "react";
import ProductCard from "./ProductCard";

function ProductsSection({ products, currentCategory, currentSearch, onClearFilters }) {
  return (
    <section id="products-section" className="px-s16 pb-s40 scroll-mt-24">
      
      {/* TOP */}
      <div className="flex items-center justify-between mb-s20">
        <h2 className="heading-h5 text-main">
          {currentCategory === "All" ? "All Products" : currentCategory}
        </h2>
        <span className="body-small text-secondary">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* GRID */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-s64 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F3EAF5] flex items-center justify-center mb-s16">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8A5AB8" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <h3 className="heading-h5 text-main mb-s8">No products found</h3>
          <p className="body-default text-secondary mb-s16">
            Try adjusting your filters or search query
          </p>

          <button
            onClick={onClearFilters}
            className="px-s24 py-s8 bg-[#8A5AB8] text-white rounded-r16 font-medium hover:bg-[#7A4AA8] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-s16">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductsSection;
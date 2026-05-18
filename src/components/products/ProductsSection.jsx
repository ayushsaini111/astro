"use client";

import React from "react";

import { ChevronDown } from "lucide-react";

import ProductCard from "./ProductCard";

const products = [1, 2, 3, 4];

function ProductsSection() {
  return (
    <section className="px-s16 pb-s40">

      {/* TOP */}
      <div className="flex items-center justify-between mb-s20">

        <h2 className="heading-h5 text-main">
          All Products
        </h2>

        <button className="flex items-center gap-s4">

          <span className="text-xs text-[#8A5AB8]">
            Sort
          </span>

          <ChevronDown
            size={16}
            className="text-[#8A5AB8]"
          />

        </button>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-s16">

        {products.map((item) => (
          <ProductCard key={item} />
        ))}

      </div>

    </section>
  );
}

export default ProductsSection;
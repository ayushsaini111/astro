"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Star } from "lucide-react";
import Button from "@/components/ui/Button";

function ProductCard({ product }) {
  const router = useRouter();

  // ✅ Add validation
  if (!product) {
    return null;
  }

  const handleBuyClick = (e) => {
    e.stopPropagation();
    router.push(`/allproducts/${product.id}`);
  };

  return (
    <div
      onClick={handleBuyClick}
      className="overflow-hidden rounded-r24 bg-white border border-[#E8DED5] cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* IMAGE */}
      <div className="relative h-[170px] bg-[#F6F1EB] overflow-hidden">
        <Image
          src={product.image || "/Products/product-1.png"}
          alt={product.title || "Product"}
          fill
          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
        />

        {product.originalPrice && (
          <div className="absolute top-s16 left-s16 bg-red-500 text-white px-s8 py-s4 rounded-r8 text-xs font-semibold">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Add to wishlist
          }}
          className="absolute top-s16 right-s16 w-s32 h-s32 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-[#F3EAF5] transition-colors"
        >
          <Heart size={16} className="text-[#8A5AB8]" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-s16 flex flex-col gap-s8">
        <div className="flex flex-col gap-s6">
          <h3 className="body-small text-main line-clamp-2 font-medium">
            {product.title || "Untitled Product"}
          </h3>

          <p className="text-xs text-secondary leading-relaxed line-clamp-1">
            {product.shortDescription || product.description || "No description"}
          </p>

          {/* Rating */}
          {product.rating && product.reviews && (
            <div className="flex items-center gap-s4">
              <div className="flex items-center gap-s2">
                <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
                <span className="text-xs font-medium text-main">{product.rating}</span>
              </div>
              <span className="text-xs text-secondary">({product.reviews})</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-s8">
            <span className="text-sm font-semibold text-main">
              ₹{product.price || 0}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-secondary line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          <Button
            variant="primary"
            onClick={handleBuyClick}
            className="!h-s36 !px-s16 text-xs"
          >
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
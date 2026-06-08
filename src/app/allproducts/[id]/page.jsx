"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Star, Heart, Share2, ShoppingBag } from "lucide-react";
import Button from "@/components/ui/Button";
import ProductPurchaseModal from "@/components/products/ProductPurchaseModal";
import ProductOrderConfirmation from "@/components/products/ProductOrderConfirmation";
import { ALL_PRODUCTS } from "@/data/products";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    const productId = parseInt(params.id);
    const foundProduct = ALL_PRODUCTS.find(p => p.id === productId);
    setProduct(foundProduct);
  }, [params.id]);

  const handlePurchaseSuccess = (details) => {
    // Generate order ID
    const orderId = `ORD${Date.now().toString().slice(-8)}`;
    
    // Combine product details with purchase details
    const fullOrderDetails = {
      ...details,
      orderId,
      productImage: product.image,
    };
    
    setOrderDetails(fullOrderDetails);
    setShowPurchaseModal(false);
    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setOrderDetails(null);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-h3 text-main mb-s16">Product Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        
        {/* Header */}
        <div className="bg-white border-b border-[#E0D4E3] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-s16 lg:px-s40 py-s16 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-s8 rounded-full hover:bg-[#F3EAF5] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center gap-s12">
              <button className="p-s8 rounded-full hover:bg-[#F3EAF5] transition-colors">
                <Share2 size={18} />
              </button>
              <button className="p-s8 rounded-full hover:bg-[#F3EAF5] transition-colors">
                <Heart size={18} className="text-[#8A5AB8]" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-s16 lg:px-s40 py-s32 lg:py-s64">
          <div className="lg:grid lg:grid-cols-2 lg:gap-s64 space-y-s40 lg:space-y-0">
            
            {/* Left - Images */}
            <div className="space-y-s16">
              <div className="relative w-full aspect-square rounded-r24 overflow-hidden bg-[#F6F1EB]">
                <Image
                  src={product.images[selectedImage]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
                {product.originalPrice && (
                  <div className="absolute top-s16 left-s16 bg-red-500 text-white px-s12 py-s6 rounded-r12 font-semibold">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </div>
                )}
              </div>
              
              {product.images.length > 1 && (
                <div className="flex gap-s12">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-20 rounded-r12 overflow-hidden border-2 ${
                        selectedImage === idx ? "border-[#8A5AB8]" : "border-transparent"
                      }`}
                    >
                      <Image src={img} alt={`${product.title} ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Details */}
            <div className="space-y-s24">
              
              {/* Title & Rating */}
              <div className="space-y-s12">
                <h1 className="heading-h3 text-main">{product.title}</h1>
                <p className="body-default text-secondary">{product.description}</p>
                
                <div className="flex items-center gap-s16">
                  <div className="flex items-center gap-s4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < Math.floor(product.rating) ? "#F59E0B" : "none"}
                        stroke="#F59E0B"
                      />
                    ))}
                    <span className="body-small text-main font-medium ml-s4">
                      {product.rating}
                    </span>
                  </div>
                  <span className="body-small text-secondary">
                    ({product.reviews} reviews)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-s16">
                <span className="heading-h4 text-primary-main">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="heading-h6 text-secondary line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-s8">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="body-small text-green-600 font-medium">In Stock</span>
              </div>

              {/* Benefits */}
              <div className="space-y-s12">
                <h3 className="heading-h6 text-main">Key Benefits</h3>
                <div className="space-y-s8">
                  {product.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-s8">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                      <span className="body-default text-secondary">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={() => setShowPurchaseModal(true)}
                className="w-full !py-s16 flex items-center justify-center gap-s8"
              >
                <ShoppingBag size={18} />
                Buy Now
              </Button>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-s64 space-y-s40">
            
            {/* Description */}
            <div className="space-y-s16">
              <h2 className="heading-h4 text-main">About This Product</h2>
              <p className="body-default text-secondary leading-relaxed">
                {product.longDescription}
              </p>
            </div>

            {/* Specifications */}
            <div className="space-y-s16">
              <h3 className="heading-h5 text-main">Specifications</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-s16">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-[#E0D4E3] pb-s8">
                    <span className="body-default text-secondary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="body-default text-main font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {product.testimonials && product.testimonials.length > 0 && (
              <div className="space-y-s24">
                <h3 className="heading-h5 text-main">Customer Reviews</h3>
                <div className="space-y-s16">
                  {product.testimonials.map((review, idx) => (
                    <div key={idx} className="bg-white border border-[#E0D4E3] rounded-r16 p-s24">
                      <div className="flex items-start justify-between mb-s12">
                        <div>
                          <h4 className="body-default font-semibold text-main">{review.name}</h4>
                          <p className="body-small text-secondary">{review.location}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} size={14} fill="#F59E0B" stroke="#F59E0B" />
                          ))}
                        </div>
                      </div>
                      <p className="body-default text-secondary leading-relaxed">{review.text}</p>
                      <p className="body-small text-secondary/50 mt-s8">{review.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <ProductPurchaseModal
          product={product}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Order Confirmation */}
      <ProductOrderConfirmation
        isOpen={showConfirmation}
        onClose={handleConfirmationClose}
        orderDetails={orderDetails}
      />
    </>
  );
}
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { CheckCircle2, Package, MapPin, Clock } from "lucide-react";

export default function ProductOrderConfirmation({ isOpen, onClose, orderDetails }) {
  const router = useRouter();

  if (!isOpen || !orderDetails) return null;

  const handleExploreMore = () => {
    onClose();
    router.push("/allproducts");
  };

  const handleViewOrders = () => {
    onClose();
    // TODO: Navigate to orders page
    router.push("/profile/orders");
  };

  const handleTrackOrder = () => {
    onClose();
    // TODO: Navigate to order tracking page
    router.push(`/orders/${orderDetails.orderId || "latest"}`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-s16 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[95vh] bg-white rounded-r32 shadow-2xl overflow-hidden animate-slideUp flex flex-col">
        
        {/* Success Header - Fixed */}
        <div className="relative bg-gradient-to-br from-[#8A5AB8] to-[#C39BD3] px-s24 py-s24 text-center flex-shrink-0">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-s16 bg-white rounded-full flex items-center justify-center animate-scaleIn">
              <CheckCircle2 size={32} className="text-green-500" strokeWidth={2.5} />
            </div>
            
            <h2 className="heading-h4 text-white mb-s6">Order Placed Successfully!</h2>
            <p className="body-small text-white/90">
              Thank you for your purchase
            </p>
          </div>
        </div>

        {/* Order Details - Scrollable */}
        <div className="flex-1 overflow-y-auto px-s24 py-s16 space-y-s24">
          
          {/* Product Info */}
          <div className="flex items-start gap-s16 pb-s16 border-b border-[#E0D4E3]">
            <div className="relative w-20 h-20 rounded-r16 overflow-hidden flex-shrink-0 bg-[#F6F1EB]">
              <Image
                src={orderDetails.productImage || "/Products/product-1.png"}
                alt={orderDetails.productTitle}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="body-default font-semibold text-main mb-s4">
                {orderDetails.productTitle}
              </h3>
              <p className="body-small text-secondary mb-s6">
                Quantity: {orderDetails.quantity}
              </p>
              <div className="flex items-center gap-s8">
                <span className="heading-h6 text-primary-main">
                  ₹{orderDetails.totalPrice?.toLocaleString()}
                </span>
                {orderDetails.unitPrice && orderDetails.quantity > 1 && (
                  <span className="body-small text-secondary">
                    (₹{orderDetails.unitPrice} × {orderDetails.quantity})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Order ID & Status */}
          <div className="bg-[#F9F4FB] rounded-r16 p-s16 space-y-s10">
            <div className="flex items-center justify-between">
              <span className="body-small text-secondary">Order ID</span>
              <span className="body-small font-mono font-semibold text-main">
                #{orderDetails.orderId || `ORD${Date.now().toString().slice(-8)}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="body-small text-secondary">Order Date</span>
              <span className="body-small text-main">
                {new Date(orderDetails.orderDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="body-small text-secondary">Payment Status</span>
              <span className="body-small text-green-600 font-medium flex items-center gap-s4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Confirmed
              </span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="space-y-s16">
            <h4 className="body-default font-semibold text-main flex items-center gap-s8">
              <Package size={18} className="text-[#8A5AB8]" />
              Delivery Information
            </h4>
            
            <div className="space-y-s16">
              {/* Delivery Address */}
              <div className="flex items-start gap-s16">
                <div className="w-8 h-8 rounded-full bg-[#F3EAF5] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} className="text-[#8A5AB8]" />
                </div>
                <div className="flex-1">
                  <p className="body-small font-medium text-main mb-s4">Delivery Address</p>
                  <p className="body-small text-secondary leading-relaxed">
                    {orderDetails.deliveryLocation?.fullAddress || "Address not provided"}
                  </p>
                  {orderDetails.deliveryLocation?.type === "coordinates" && (
                    <p className="body-small text-secondary/50 font-mono text-xs mt-s4">
                      📍 GPS: {orderDetails.deliveryLocation.latitude?.toFixed(6)}, {orderDetails.deliveryLocation.longitude?.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              {/* Estimated Delivery */}
              <div className="flex items-start gap-s16">
                <div className="w-8 h-8 rounded-full bg-[#F3EAF5] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={14} className="text-[#8A5AB8]" />
                </div>
                <div className="flex-1">
                  <p className="body-small font-medium text-main mb-s4">Estimated Delivery</p>
                  <p className="body-small text-secondary">
                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </p>
                  <p className="body-small text-secondary/70 mt-s2">
                    (Within 5-7 business days)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-r16 p-s8">
            <p className="body-small text-blue-900 leading-relaxed">
              <span className="font-semibold">📱 Order updates</span> will be sent to{" "}
              <span className="font-medium">{orderDetails.userDetails?.phone}</span>
              {orderDetails.userDetails?.email && (
                <> and <span className="font-medium">{orderDetails.userDetails.email}</span></>
              )}
            </p>
          </div>

          {/* Special Instructions */}
          {orderDetails.userDetails?.specialRequests && (
            <div className="bg-amber-50 border border-amber-200 rounded-r16 p-s16">
              <p className="body-small font-medium text-amber-900 mb-s4">Special Instructions:</p>
              <p className="body-small text-amber-800 leading-relaxed">
                "{orderDetails.userDetails.specialRequests}"
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-s16 ">
            <Button
              variant="tertiary"
              onClick={handleExploreMore}
              className="w-full !rounded-r32 !py-s16"
            >
              Explore More Products
            </Button>
          </div>

          {/* Help Section */}
       
        </div>
      </div>
    </div>
  );
}
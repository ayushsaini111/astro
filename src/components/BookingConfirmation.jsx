"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function BookingConfirmation({ isOpen, onClose, bookingDetails }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-s16 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-r32 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 w-full" />
        
        <div className="px-s24 py-s32 text-center space-y-s24">
          
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
          </div>

          {/* Success Message */}
          <div className="space-y-s16">
            <h3 className="heading-h4 text-main">E-Pooja Booked Successfully! 🙏</h3>
            <p className="body-default text-secondary leading-relaxed">
              Your online spiritual session has been confirmed. You'll receive the session details via email shortly.
            </p>
          </div>

          {/* Booking Details */}
          {bookingDetails && (
            <div className="bg-[#F9F4FB] rounded-r16 p-s24 text-left space-y-s16">
              <h4 className="body-default font-semibold text-main">Booking Summary</h4>
              <div className="space-y-s8 body-small text-secondary">
                <div className="flex justify-between items-start">
                  <span className="text-secondary">Service:</span>
                  <span className="text-main font-medium text-right flex-1 ml-s8">
                    {bookingDetails.ritualTitle}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-secondary">Package:</span>
                  <span className="text-main font-medium text-right flex-1 ml-s8">
                    {bookingDetails.packageName}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-secondary">Date:</span>
                  <span className="text-main font-medium text-right flex-1 ml-s8">
                    {bookingDetails.date}
                  </span>
                </div>
                <div className="pt-s8 border-t border-[#E0D4E3] flex justify-between items-start">
                  <span className="text-secondary">Amount Paid:</span>
                  <span className="text-primary-main font-semibold text-right flex-1 ml-s8">
                    ₹{bookingDetails.price?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

     

          {/* Actions */}
          <div className="space-y-s16">
            <Button 
              onClick={onClose} 
              variant="primary" 
              className="w-full !rounded-r16 !py-s14"
            >
              Perfect! Got it ✨
            </Button>
            
          
          </div>

          {/* Additional Info */}
          <div className="text-center pt-s8 border-t border-[#E0D4E3]">
            <p className="body-small text-secondary">
              Need help? Contact us at{" "}
              <a 
                href="mailto:support@rantraa.com" 
                className="text-primary-main hover:underline font-medium"
              >
                support@rantraa.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
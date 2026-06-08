"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import BookingConfirmation from "@/components/BookingConfirmation";

export default function BookingModal({ ritual, selectedPackage, onClose, onSuccess }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const overlayRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: session?.user?.username || session?.user?.name || "",
    phone: session?.user?.phone || "",
    email: session?.user?.email || "",
    date: "",
    time: "morning", // ✅ Default value since field is removed
    specialRequests: "",
    preferredPlatform: "whatsapp"
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  if (!ritual || !selectedPackage) {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-s16">
        <div className="bg-white rounded-r24 p-s32 max-w-sm w-full text-center space-y-s24">
          <h3 className="heading-h5 text-main">Sign In Required</h3>
          <p className="body-default text-secondary">Please sign in to book this e-pooja</p>
          <div className="flex gap-s16">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onClose();
                router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
              }}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.date) {
      newErrors.date = "Preferred date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (selectedDate < tomorrow) {
        newErrors.date = "Please select a date at least 1 day in advance";
      }
    }

    // ✅ REMOVED: Time validation since field is removed from UI

    return newErrors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const formatTimeDisplay = (timeSlot) => {
    const timeMap = {
      morning: "Morning (6:00 AM - 12:00 PM)",
      afternoon: "Afternoon (12:00 PM - 6:00 PM)",  
      evening: "Evening (6:00 PM - 10:00 PM)"
    };
    return timeMap[timeSlot] || timeSlot;
  };

  const formatPlatformDisplay = (platform) => {
    const platformMap = {
      whatsapp: "WhatsApp Video Call",
      zoom: "Zoom Meeting",
      "google-meet": "Google Meet"
    };
    return platformMap[platform] || platform;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const bookingData = {
        ritualId: ritual.id,
        ritualTitle: ritual.title,
        serviceType: ritual.serviceType,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        date: new Date(formData.date).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        }),
        time: formatTimeDisplay(formData.time),
        platform: formatPlatformDisplay(formData.preferredPlatform),
        userDetails: formData,
        bookingDate: new Date().toISOString(),
      };

      console.log("📅 E-Pooja booking submitted:", bookingData);
      
      setBookingDetails(bookingData);
      setShowConfirmation(true);
      
    } catch (error) {
      console.error("Booking error:", error);
      setErrors({ submit: "Failed to submit booking. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !isSubmitting) {
      onClose();
    }
  };

  return (
    <>
      {/* Booking Modal */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-s16 overflow-y-auto"
      >
        <div className="bg-white rounded-r24 w-full max-w-2xl my-s24 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="border-b border-[#E0D4E3] p-s24 flex items-start justify-between sticky top-0 bg-white rounded-t-r24 z-10">
            <div>
              <h2 className="heading-h4 text-main">Book Online E-Pooja</h2>
              <p className="body-default text-secondary mt-s4">
                {ritual.title} - {selectedPackage.name}
              </p>
              <div className="flex items-center gap-s8 mt-s6">
                <span className="bg-green-100 text-green-800 px-s8 py-s6 rounded-r8 text-xs flex items-center gap-s6">
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                  Live Online Session
                </span>
                <span className="body-small text-primary-main font-semibold">
                  ₹{selectedPackage.price.toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3EAF5] transition-colors disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-s24 space-y-s20">
            
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-r12 p-s16 text-red-700 body-small">
                {errors.submit}
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-s16">
              <h3 className="heading-h6 text-main">Personal Details</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-s16">
                <div>
                  <label className="block body-small font-medium text-main mb-s6">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-s16 py-s8 border rounded-r8 focus:outline-none transition-colors disabled:bg-gray-50 ${
                      errors.name ? "border-red-500" : "border-[#E0D4E3] focus:border-primary-main"
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <p className="text-red-500 body-small mt-s4">{errors.name}</p>}
                </div>

                <div>
                  <label className="block body-small font-medium text-main mb-s6">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-s16 py-s8 border rounded-r8 focus:outline-none transition-colors disabled:bg-gray-50 ${
                      errors.phone ? "border-red-500" : "border-[#E0D4E3] focus:border-primary-main"
                    }`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && <p className="text-red-500 body-small mt-s4">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block body-small font-medium text-main mb-s6">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-s16 py-s8 border rounded-r8 focus:outline-none transition-colors disabled:bg-gray-50 ${
                    errors.email ? "border-red-500" : "border-[#E0D4E3] focus:border-primary-main"
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 body-small mt-s4">{errors.email}</p>}
                <p className="text-xs text-secondary mt-s4">Session link will be sent here</p>
              </div>
            </div>

            {/* Session Details */}
            <div className="space-y-s16">
              <h3 className="heading-h6 text-main">Session Details</h3>
              
              <div>
                <label className="block body-small font-medium text-main mb-s6">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-s16 py-s8 border rounded-r8 focus:outline-none transition-colors disabled:bg-gray-50 ${
                    errors.date ? "border-red-500" : "border-[#E0D4E3] focus:border-primary-main"
                  }`}
                />
                {errors.date && <p className="text-red-500 body-small mt-s4">{errors.date}</p>}
                <p className="text-xs text-secondary mt-s4">Our team will coordinate the best time with you</p>
              </div>

              <div>
                <label className="block body-small font-medium text-main mb-s6">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-s16 py-s8 border border-[#E0D4E3] rounded-r8 focus:outline-none focus:border-primary-main transition-colors resize-none disabled:bg-gray-50"
                  rows={3}
                  placeholder="Any specific requirements, questions about the ritual, or preferred mantras..."
                />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="bg-[#F9F4FB] rounded-r16 p-s24 space-y-s16">
              <h4 className="heading-h6 text-main">Booking Summary</h4>
              <div className="space-y-s8">
                <div className="flex justify-between">
                  <span className="body-default text-secondary">{selectedPackage.name}</span>
                  <span className="body-default text-main">₹{selectedPackage.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="body-default text-secondary">Service Type</span>
                  <span className="body-default text-main">{ritual.serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="body-default text-secondary">Platform Charges</span>
                  <span className="body-default text-main">Free</span>
                </div>
                <div className="border-t border-[#E0D4E3] pt-s8 flex justify-between">
                  <span className="heading-h6 text-main">Total Amount</span>
                  <span className="heading-h6 text-primary-main">₹{selectedPackage.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-s16 pt-s24">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-s8">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Booking...
                  </span>
                ) : (
                  "Confirm E-Pooja Booking"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Booking Confirmation Popup */}
      <BookingConfirmation 
        isOpen={showConfirmation}
        onClose={handleConfirmationClose}
        bookingDetails={bookingDetails}
      />
    </>
  );
}
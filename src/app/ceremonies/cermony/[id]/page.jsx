"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";
import BookingConfirmation from "@/components/BookingConfirmation";
import CeremonyBookingModal from "@/components/ceremonies/CeremonyBookingModal";
import { CEREMONIES_DATA } from "@/data/ceremonies";

export default function CeremonyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ceremony, setCeremony] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    const ceremonyId = parseInt(params.id);
    
    setTimeout(() => {
      const ceremonyData = CEREMONIES_DATA[ceremonyId];
      setCeremony(ceremonyData);
      setLoading(false);
      
      if (ceremonyData?.pricing?.premium) {
        setSelectedPackage('premium');
      } else if (ceremonyData?.pricing) {
        const firstPackage = Object.keys(ceremonyData.pricing)[0];
        setSelectedPackage(firstPackage);
      }
    }, 500);
  }, [params.id]);

  const handleBookNow = () => {
    if (!selectedPackage) {
      alert("Please select a package first");
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (details) => {
    setBookingDetails(details);
    setShowConfirmation(true);
    setShowBookingModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-s16">
          <div className="w-12 h-12 border-4 border-primary-main border-t-transparent rounded-full animate-spin"></div>
          <p className="body-default text-secondary">Loading ceremony details...</p>
        </div>
      </div>
    );
  }

  if (!ceremony) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-s16">
        <div className="text-center space-y-s24 max-w-md">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
          </div>
          <div className="space-y-s16">
            <h1 className="heading-h3 text-main">Ceremony Not Found</h1>
            <p className="body-default text-secondary">
              The ceremony you're looking for doesn't exist or has been removed.
            </p>
          </div>
          <div className="flex flex-col gap-s16">
            <Button onClick={() => router.back()} variant="primary">
              Go Back
            </Button>
            <Button onClick={() => router.push("/ceremonies")} variant="secondary">
              Browse All Ceremonies
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        
        {/* Header */}
        <div className="bg-white border-b border-[#E0D4E3] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-s16 lg:px-s40 py-s16 flex items-center gap-s16">
            <button
              onClick={() => router.back()}
              className="p-s8 rounded-full hover:bg-[#F3EAF5] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <div>
              <h1 className="heading-h6 text-main">{ceremony.title}</h1>
              <p className="body-small text-secondary">{ceremony.category} • {ceremony.duration}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-s16 lg:px-s40 py-s32 lg:py-s64">
          <div className="lg:grid lg:grid-cols-3 lg:gap-s64 space-y-s40 lg:space-y-0">
            
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-s40">
              
              {/* Hero Image */}
              <div className="relative w-full h-[300px] lg:h-[400px] rounded-r24 overflow-hidden">
                <Image
                  src={imageError ? "/Rituals/ganeshji.jpg" : ceremony.image}
                  alt={ceremony.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute top-s16 left-s16">
                  <span className="bg-primary-main text-white px-s16 py-s6 rounded-r16 body-small">
                    {ceremony.serviceType}
                  </span>
                </div>
                <div className="absolute top-s16 right-s16">
                  
                </div>
              </div>

              {/* Description */}
              <div className="space-y-s16">
                <h2 className="heading-h4 text-main">About This Ceremony</h2>
                <p className="body-default text-secondary leading-relaxed">
                  {ceremony.longDescription}
                </p>
              </div>

              {/* What's Included */}
              <div className="space-y-s16">
                <h3 className="heading-h5 text-main">What's Included</h3>
                <div className="grid gap-s16">
                  {ceremony.includes.map((item, index) => (
                    <div key={index} className="flex items-start gap-s16">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </div>
                      <span className="body-default text-secondary">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-s16">
                <h3 className="heading-h5 text-main">Benefits</h3>
                <div className="grid gap-s16">
                  {ceremony.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-s16">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="3">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                      </div>
                      <span className="body-default text-secondary">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pandit Info */}
              <div className="bg-[#F9F4FB] rounded-r24 p-s24">
                <h3 className="heading-h5 text-main mb-s16">Your Pandit</h3>
                <div className="flex items-center gap-s16">
                  <div className="w-16 h-16 rounded-full bg-[#E8D8EA] flex items-center justify-center overflow-hidden">
                    <span className="heading-h5 text-[#9B59B6]">
                      {ceremony.pandit.name[0]}
                    </span>
                  </div>
                  <div>
                    <h4 className="body-default font-semibold text-main">{ceremony.pandit.name}</h4>
                    <p className="body-small text-secondary">{ceremony.pandit.experience} • {ceremony.pandit.specialization}</p>
                  </div>
                </div>
              </div>

              {/* Testimonials */}
              {ceremony.testimonials && ceremony.testimonials.length > 0 && (
                <div className="space-y-s16">
                  <h3 className="heading-h5 text-main">What People Say</h3>
                  <div className="space-y-s16">
                    {ceremony.testimonials.map((testimonial, index) => (
                      <div key={index} className="bg-white border border-[#E0D4E3] rounded-r16 p-s16">
                        <div className="flex items-start justify-between mb-s16">
                          <div>
                            <h4 className="body-default font-semibold text-main">{testimonial.name}</h4>
                            <p className="body-small text-secondary">{testimonial.location}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="body-default text-secondary leading-relaxed">{testimonial.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Pricing */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                
                {/* Package Selection */}
                <div className="bg-white border border-[#E0D4E3] rounded-r24 p-s24 space-y-s24">
                  <h3 className="heading-h5 text-main">Choose Your Package</h3>
                  
                  <div className="space-y-s16">
                    {Object.entries(ceremony.pricing).map(([key, pkg]) => (
                      <div
                        key={key}
                        onClick={() => setSelectedPackage(key)}
                        className={`relative border-2 rounded-r16 p-s16 cursor-pointer transition-all ${
                          selectedPackage === key
                            ? 'border-primary-main bg-[#F9F4FB]'
                            : 'border-[#E0D4E3] hover:border-[#C39BD3]'
                        }`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-2 left-4 bg-primary-main text-white px-s8 py-s2 rounded-r8 text-xs">
                            Most Popular
                          </div>
                        )}
                        
                        <div className="space-y-s8">
                          <div className="flex items-center justify-between">
                            <h4 className="body-default font-semibold text-main">{pkg.name}</h4>
                            <div className="flex items-center gap-s4">
                              <span className="heading-h6 text-primary-main">₹{pkg.price.toLocaleString()}</span>
                              {pkg.originalPrice && (
                                <span className="body-small text-secondary line-through">₹{pkg.originalPrice.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          
                          <p className="body-small text-secondary">Duration: {pkg.duration}</p>
                          
                          <div className="space-y-s4">
                            {pkg.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-s8">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                                <span className="body-small text-secondary">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Book Now Button */}
                  <Button
                    onClick={handleBookNow}
                    disabled={!selectedPackage}
                    className="w-full !py-s16 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Book Now - ₹{selectedPackage ? ceremony.pricing[selectedPackage].price.toLocaleString() : '0'}
                  </Button>

                  {/* Additional Info */}
                  <div className="pt-s16 border-t border-[#E0D4E3] space-y-s8 text-center">
                    <p className="body-small text-secondary">
                      <strong>Duration:</strong> {ceremony.duration}
                    </p>
                    <p className="body-small text-secondary">
                      <strong>Languages:</strong> {ceremony.language}
                    </p>
                    <div className="flex items-center justify-center gap-s8 text-green-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      <span className="body-small">100% Satisfaction Guaranteed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <CeremonyBookingModal
          ceremony={ceremony}
          selectedPackage={ceremony.pricing[selectedPackage]}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Confirmation Popup */}
      <BookingConfirmation 
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          router.push("/ceremonies");
        }}
        bookingDetails={bookingDetails}
      />
    </>
  );
}
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";

// ─── Map Picker Component ─────────────────────────────────────────────────────
function MapPicker({ initialCoords, onConfirm, onClose }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const abortRef = useRef(null);

  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(initialCoords ?? null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const LOCATIONIQ_KEY = process.env.NEXT_PUBLIC_LOCATIONIQ_KEY ?? "";

  useEffect(() => {
    if (!LOCATIONIQ_KEY) {
      console.error("❌ NEXT_PUBLIC_LOCATIONIQ_KEY not found");
      setError("Geocoding service not configured");
    }
  }, [LOCATIONIQ_KEY]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!LOCATIONIQ_KEY) {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&format=json&accept-language=en`,
        { 
          signal: controller.signal,
          headers: { "Accept-Language": "en" }
        }
      );

      if (!res.ok) {
        if (res.status === 429) throw new Error("Too many requests. Please wait.");
        if (res.status === 401) throw new Error("Invalid API key");
        throw new Error(`Geocoding failed (${res.status})`);
      }

      const data = await res.json();
      const a = data.address ?? {};
      const parts = [
        a.house_number,
        a.road ?? a.pedestrian ?? a.footway,
        a.suburb ?? a.neighbourhood ?? a.quarter,
        a.city ?? a.town ?? a.village,
        a.state,
      ].filter(Boolean);

      const fullAddress = parts.join(", ") || data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fullAddress);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Geocoding error:", err);
      setError(err.message || "Could not fetch address");
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  }, [LOCATIONIQ_KEY]);

  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapContainerRef.current || mapRef.current) return;
      
      if (!window.L) {
        setError("Map failed to load. Please refresh.");
        return;
      }

      const L = window.L;
      const lat = initialCoords?.lat ?? 26.4499;
      const lng = initialCoords?.lng ?? 80.3319;

      try {
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 17,
          zoomControl: false,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '© OpenStreetMap',
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const icon = L.divIcon({
          className: "",
          html: `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:36px;height:36px;background:#8A5AB8;border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);border:3px solid white;
              box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
            <div style="width:8px;height:8px;background:#8A5AB8;border-radius:50%;
              margin-top:2px;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></div>
          </div>`,
          iconSize: [36, 46],
          iconAnchor: [18, 46],
        });

        const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          reverseGeocode(pos.lat, pos.lng);
        });

        map.on("click", (e) => {
          marker.setLatLng(e.latlng);
          setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        if (initialCoords) {
          reverseGeocode(lat, lng);
        }
      } catch (err) {
        console.error("Map init error:", err);
        setError("Failed to initialize map");
      }
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      script.onerror = () => setError("Map library failed to load");
      document.head.appendChild(script);
    }

    return () => {
      abortRef.current?.abort();
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn("Error removing map:", e);
        }
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [initialCoords, reverseGeocode]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError("GPS not supported");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        const lat = c.latitude;
        const lng = c.longitude;
        
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setError("Invalid GPS coordinates");
          setLocating(false);
          return;
        }

        setCoords({ lat, lng });
        mapRef.current?.setView([lat, lng], 18);
        markerRef.current?.setLatLng([lat, lng]);
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        const msgs = {
          1: "Location access denied. Enable permissions in browser settings.",
          2: "Location unavailable. Check device settings.",
          3: "Location request timed out.",
        };
        setError(msgs[err.code] || "Could not get location. Drag pin manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (!initialCoords && !error) {
      const timer = setTimeout(handleLocateMe, 500);
      return () => clearTimeout(timer);
    }
  }, [initialCoords, handleLocateMe, error]);

  const handleConfirm = () => {
    if (!coords) {
      setError("Please select a delivery location on the map");
      return;
    }
    if (!address) {
      setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    }
    onConfirm({ coords, address: address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` });
  };

  return (
    <div className="fixed inset-0 z-[65] flex max-w-5xl mx-auto my-auto md:h-[90vh] flex-col bg-white">
      <div className="flex items-center gap-s16 px-s16 py-s16 border-b border-[#E0D4E3] bg-white flex-shrink-0 shadow-sm">
        <button 
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3EAF5] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="heading-h5 text-main">Select Delivery Location</span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />

        <button
          onClick={handleLocateMe}
          disabled={locating}
          className="absolute bottom-[210px] right-s16 z-[400] flex items-center gap-s8 bg-white rounded-r16 shadow-lg px-s16 py-s8 body-small font-medium text-main border border-[#E0D4E3] hover:bg-[#F3EAF5] transition-colors disabled:opacity-60"
        >
          {locating ? (
            <>
              <svg className="animate-spin text-[#8A5AB8]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Locating…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A5AB8" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
              Use current location
            </>
          )}
        </button>
      </div>

      <div className="bg-white px-s16 pt-s18 pb-s16 flex flex-col gap-s16 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex-shrink-0">
        {error && (
          <div className="flex items-start gap-s8 bg-red-50 border border-red-200 rounded-r12 px-s16 py-s8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p className="body-small text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex items-start gap-s16">
          <div className="w-9 h-9 rounded-full bg-[#F3EAF5] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A5AB8" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="flex flex-col flex-1 gap-s4">
            <span className="body-small font-semibold text-main">
              {coords ? "Delivery address" : "No location selected"}
            </span>
            {loading || locating ? (
              <div className="flex flex-col gap-s4">
                <div className="h-3 w-52 bg-[#E8D8EA] rounded animate-pulse" />
                <div className="h-3 w-36 bg-[#E8D8EA] rounded animate-pulse" />
              </div>
            ) : (
              <>
                <span className="body-small text-secondary leading-relaxed">
                  {address || "Tap the map or use current location"}
                </span>
                {coords && (
                  <span className="body-small text-secondary/50 font-mono text-xs">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <p className="body-small text-secondary/50">
          Drag the pin or tap the map to adjust delivery location
        </p>

        {LOCATIONIQ_KEY && (
          <p className="body-small text-secondary/40 text-right -mt-s4">
            Search by{" "}
            <a href="https://locationiq.com" target="_blank" rel="noopener" className="underline hover:text-[#8A5AB8]">
              LocationIQ
            </a>
          </p>
        )}

        <Button
          variant="tertiary"
          onClick={handleConfirm}
          disabled={!coords || loading || locating}
          className="!rounded-r16 !py-s16 w-full disabled:opacity-50"
        >
          Confirm Delivery Location →
        </Button>
      </div>
    </div>
  );
}

// ─── Main Product Purchase Modal ──────────────────────────────────────────────
export default function ProductPurchaseModal({ product, onClose, onSuccess }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const overlayRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: session?.user?.username || session?.user?.name || "",
    phone: session?.user?.phone || session?.user?.phoneNumber || "",
    email: session?.user?.email || "",
    quantity: 1,
    specialRequests: "",
  });

  // Location state
  const [locationMethod, setLocationMethod] = useState("map");
  const [showMap, setShowMap] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [mapAddress, setMapAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = showMap ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMap]);

  if (!product) {
    return null;
  }

  if (status === "unauthenticated") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-s16">
        <div className="bg-white rounded-r24 p-s32 max-w-sm w-full text-center space-y-s16">
          <h3 className="heading-h5 text-main">Sign In Required</h3>
          <p className="body-default text-secondary">Please sign in to purchase this product</p>
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

  const handleMapConfirm = ({ coords, address }) => {
    setMapCoords(coords);
    setMapAddress(address);
    setShowMap(false);
    setErrors(prev => ({ ...prev, location: null }));
  };

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

    // Validate location based on method
    if (locationMethod === "map") {
      if (!mapCoords) {
        newErrors.location = "Please pin your delivery location on the map";
      }
    } else {
      if (!manualAddress.trim()) {
        newErrors.manualAddress = "Please enter your complete delivery address";
      }
    }

    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    return newErrors;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const purchaseData = {
        productId: product.id,
        productTitle: product.title,
        quantity: parseInt(formData.quantity),
        unitPrice: product.price,
        totalPrice: product.price * parseInt(formData.quantity),
        deliveryLocation: locationMethod === "map" ? {
          type: "coordinates",
          latitude: mapCoords.lat,
          longitude: mapCoords.lng,
          detectedAddress: mapAddress,
          fullAddress: mapAddress,
        } : {
          type: "manual",
          latitude: null,
          longitude: null,
          detectedAddress: null,
          fullAddress: manualAddress.trim(),
        },
        userDetails: formData,
        orderDate: new Date().toISOString(),
      };

      console.log("🛒 Product purchase submitted:", purchaseData);
      onSuccess(purchaseData);
      
    } catch (error) {
      console.error("Purchase error:", error);
      setErrors({ submit: "Failed to complete purchase. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !isSubmitting) {
      onClose();
    }
  };

  const totalPrice = product.price * (formData.quantity || 1);

  return (
    <>
      {/* Map Picker */}
      {showMap && (
        <MapPicker
          initialCoords={mapCoords}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* Main Modal */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-s16 overflow-y-auto"
      >
        <div className="bg-white rounded-r24 w-full max-w-2xl my-s16 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="border-b border-[#E0D4E3] p-s16 flex items-start justify-between sticky top-0 bg-white z-10">
            <div className="flex items-start gap-s16 flex-1">
              <div className="relative w-16 h-16 rounded-r12 overflow-hidden flex-shrink-0">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="heading-h5 text-main">{product.title}</h2>
                <p className="body-small text-secondary mt-s4">
                  {product.shortDescription}
                </p>
                <div className="flex items-center gap-s8 mt-s6">
                  <span className="bg-green-100 text-green-800 px-s8 py-s6 rounded-r8 text-xs flex items-center gap-s6">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    In Stock
                  </span>
                  <span className="body-small text-primary-main font-semibold">
                    ₹{product.price}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3EAF5] transition-colors disabled:opacity-50 flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-s16 space-y-s16">
            
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
                      errors.name ? "border-red-500" : "border-[#E0D4E3] focus:border-[#8A5AB8]"
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
                      errors.phone ? "border-red-500" : "border-[#E0D4E3] focus:border-[#8A5AB8]"
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
                    errors.email ? "border-red-500" : "border-[#E0D4E3] focus:border-[#8A5AB8]"
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-red-500 body-small mt-s4">{errors.email}</p>}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-s16">
              <h3 className="heading-h6 text-main">Order Details</h3>
              
              <div>
                <label className="block body-small font-medium text-main mb-s6">
                  Quantity *
                </label>
                <div className="flex items-center gap-s8">
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = Math.max(1, (formData.quantity || 1) - 1);
                      handleInputChange("quantity", newQty);
                    }}
                    disabled={isSubmitting || formData.quantity <= 1}
                    className="w-10 h-10 rounded-r8 border border-[#E0D4E3] flex items-center justify-center hover:bg-[#F3EAF5] transition-colors disabled:opacity-50"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
                    disabled={isSubmitting}
                    className={`w-20 px-s16 py-s8 border rounded-r8 text-center focus:outline-none transition-colors disabled:bg-gray-50 ${
                      errors.quantity ? "border-red-500" : "border-[#E0D4E3] focus:border-[#8A5AB8]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newQty = (formData.quantity || 1) + 1;
                      handleInputChange("quantity", newQty);
                    }}
                    disabled={isSubmitting}
                    className="w-10 h-10 rounded-r8 border border-[#E0D4E3] flex items-center justify-center hover:bg-[#F3EAF5] transition-colors disabled:opacity-50"
                  >
                    +
                  </button>
                  <span className="body-small text-secondary ml-s8">
                    ₹{product.price} × {formData.quantity} = ₹{totalPrice.toLocaleString()}
                  </span>
                </div>
                {errors.quantity && <p className="text-red-500 body-small mt-s4">{errors.quantity}</p>}
              </div>

              {/* Delivery Location - Choose method */}
              <div className="flex flex-col gap-s16">
                <p className="body-small font-medium text-main">
                  Delivery Address <span className="text-red-500">*</span>
                </p>

                {/* Method selector */}
                <div className="flex gap-s8 p-s4 bg-[#F3EAF5] rounded-r16">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMethod("map");
                      setErrors(prev => ({ ...prev, manualAddress: null }));
                    }}
                    disabled={isSubmitting}
                    className={`flex-1 py-s8 px-s16 rounded-r12 body-small font-medium transition-all disabled:opacity-50 ${
                      locationMethod === "map"
                        ? "bg-white text-[#8A5AB8] shadow-sm"
                        : "text-secondary hover:text-main"
                    }`}
                  >
                    📍 Pin on Map
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMethod("manual");
                      setErrors(prev => ({ ...prev, location: null }));
                    }}
                    disabled={isSubmitting}
                    className={`flex-1 py-s8 px-s16 rounded-r12 body-small font-medium transition-all disabled:opacity-50 ${
                      locationMethod === "manual"
                        ? "bg-white text-[#8A5AB8] shadow-sm"
                        : "text-secondary hover:text-main"
                    }`}
                  >
                    ✍️ Enter Address
                  </button>
                </div>

                {/* Map method */}
                {locationMethod === "map" && (
                  <>
                    {errors.location && (
                      <p className="body-small text-red-600">{errors.location}</p>
                    )}

                    {!mapAddress ? (
                      <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        disabled={isSubmitting}
                        className={`flex items-center gap-s16 rounded-r20 border-2 ${errors.location ? 'border-red-500' : 'border-dashed border-[#C39BD3]'} bg-[#F9F4FB] px-s16 py-s16 w-full text-left hover:bg-[#F3EAF5] transition-colors group disabled:opacity-50`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#E8D8EA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#D8BFE0] transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A5AB8" strokeWidth="2.2">
                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="body-default font-semibold text-[#8A5AB8]">Pin delivery location</span>
                          <span className="body-small text-secondary">Tap to open map</span>
                        </div>
                      </button>
                    ) : (
                      <div className="rounded-r20 border border-[#C39BD3] bg-[#F9F4FB] px-s16 py-s16 flex items-start gap-s16">
                        <div className="w-9 h-9 rounded-full bg-[#E8D8EA] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A5AB8" strokeWidth="2.2">
                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div className="flex-1 flex flex-col gap-s4">
                          <span className="body-small font-semibold text-green-600">✓ Location pinned</span>
                          <span className="body-small text-secondary leading-relaxed">{mapAddress}</span>
                          <span className="body-small text-secondary/50 font-mono text-xs">
                            {mapCoords?.lat.toFixed(6)}, {mapCoords?.lng.toFixed(6)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMap(true)}
                          disabled={isSubmitting}
                          className="body-small font-medium text-[#8A5AB8] hover:underline flex-shrink-0 disabled:opacity-50"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Manual address method */}
                {locationMethod === "manual" && (
                  <div>
                    <textarea
                      name="manualAddress"
                      value={manualAddress}
                      onChange={(e) => {
                        setManualAddress(e.target.value);
                        setErrors(prev => ({ ...prev, manualAddress: null }));
                      }}
                      disabled={isSubmitting}
                      rows={4}
                      className={`w-full rounded-r16 border ${errors.manualAddress ? 'border-red-500' : 'border-[#E0D4E3]'} px-s16 py-s8 body-default text-main placeholder:text-secondary/40 focus:outline-none focus:border-[#8A5AB8] transition-colors resize-none disabled:bg-gray-50`}
                      placeholder="House/Flat No., Street, Area, City, State, Pincode"
                    />
                    {errors.manualAddress && <p className="text-red-500 body-small mt-s4">{errors.manualAddress}</p>}
                    <p className="body-small text-secondary/60 mt-s4">
                      Delivery partner will contact you if needed
                    </p>
                  </div>
                )}

                {locationMethod === "map" && mapAddress && (
                  <p className="body-small text-secondary/60 -mt-s8">
                    GPS coordinates will be used for accurate delivery
                  </p>
                )}
              </div>

              <div>
                <label className="block body-small font-medium text-main mb-s6">
                  Special Instructions (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-s16 py-s8 border border-[#E0D4E3] rounded-r8 focus:outline-none focus:border-[#8A5AB8] transition-colors resize-none disabled:bg-gray-50"
                  rows={3}
                  placeholder="e.g. Leave at door, Call before delivery, etc."
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[#F9F4FB] rounded-r16 p-s16 space-y-s16">
              <h4 className="heading-h6 text-main">Order Summary</h4>
              <div className="space-y-s8">
                <div className="flex justify-between">
                  <span className="body-default text-secondary">Product Price</span>
                  <span className="body-default text-main">₹{product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="body-default text-secondary">Quantity</span>
                  <span className="body-default text-main">× {formData.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="body-default text-secondary">Delivery Charges</span>
                  <span className="body-default text-green-600">Free</span>
                </div>
                {product.originalPrice && (
                  <div className="flex justify-between text-green-600">
                    <span className="body-default">Savings</span>
                    <span className="body-default font-medium">
                      ₹{((product.originalPrice - product.price) * formData.quantity).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-t border-[#E0D4E3] pt-s8 flex justify-between">
                  <span className="heading-h6 text-main">Total Amount</span>
                  <span className="heading-h6 text-primary-main">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-s16 pt-s16">
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
                  <span className="flex items-center gap-s8 justify-center">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Complete Purchase - ₹${totalPrice.toLocaleString()}`
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
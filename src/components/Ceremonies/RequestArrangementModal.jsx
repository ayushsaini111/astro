"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

// ─── Confirmation Popup ───────────────────────────────────────────────────────
function ConfirmationPopup({ onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-s16 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-r32 shadow-2xl overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-[#9B59B6] to-[#C39BD3]" />
        <div className="px-s24 py-s32 flex flex-col items-center gap-s24 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F3EAF5] flex items-center justify-center text-3xl">🙏</div>
          <div className="flex flex-col gap-s8">
            <h3 className="heading-h4 text-main">Request Submitted!</h3>
            <p className="body-default text-secondary leading-relaxed">
              Our team will reach out shortly. Once the pandit is assigned, you'll
              see their live location and estimated arrival time.
            </p>
          </div>
          <Button variant="tertiary" onClick={onClose} className="!rounded-r32 !px-s32 !py-s16 w-full">
            Done ✓
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Map Picker ───────────────────────────────────────────────────────────────
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
            <div style="width:36px;height:36px;background:#9B59B6;border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);border:3px solid white;
              box-shadow:0 4px 12px rgba(0,0,0,0.3);"></div>
            <div style="width:8px;height:8px;background:#9B59B6;border-radius:50%;
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
      setError("Please select a location on the map");
      return;
    }
    if (!address) {
      setAddress(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    }
    onConfirm({ coords, address: address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` });
  };

  return (
    <div className="fixed inset-0 z-[65] flex max-w-5xl mx-auto my-auto md:h-[90vh]  flex-col bg-white">
      <div className="flex items-center gap-s16 px-s16 py-s16 border-b border-[#E0D4E3] bg-white flex-shrink-0 shadow-sm">
        <button 
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F3EAF5] transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.2" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="heading-h5 text-main">Select Location</span>
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
              <svg className="animate-spin text-[#9B59B6]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Locating…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
              Use current location
            </>
          )}
        </button>
      </div>

      <div className="bg-white px-s24 pt-s18 pb-s24 flex flex-col gap-s16 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex-shrink-0">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="flex flex-col flex-1 gap-s4">
            <span className="body-small font-semibold text-main">
              {coords ? "Delivery location" : "No location selected"}
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
          Drag the pin or tap the map to adjust
        </p>

        {LOCATIONIQ_KEY && (
          <p className="body-small text-secondary/40 text-right -mt-s4">
            Search by{" "}
            <a href="https://locationiq.com" target="_blank" rel="noopener" className="underline hover:text-[#9B59B6]">
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
          Confirm Location →
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }) {
  return (
    <div className="flex flex-col gap-s6">
      <label className="body-small font-medium text-main">
        {label}{required && <span className="text-red-500 ml-s4">*</span>}
      </label>
      {children}
      {error && <p className="body-small text-red-600">{error}</p>}
      {hint && !error && <p className="body-small text-secondary/60">{hint}</p>}
    </div>
  );
}

function TextInput({ className = "", error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-r16 border ${error ? 'border-red-500' : 'border-[#E0D4E3]'} px-s16 py-s16 body-default text-main placeholder:text-secondary/40 focus:outline-none focus:border-[#9B59B6] transition-colors bg-white ${className}`}
    />
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
function RequestArrangementModal({ isOpen, onClose }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;

  // Auth redirect
  useEffect(() => {
    if (!isOpen) return;
    if (status === "loading") return;
    if (status === "unauthenticated") {
      onClose();
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
    }
  }, [isOpen, status, onClose, router]);

  // Extract user info - handle both Google and OTP login
  const dbUsername = user?.username ?? user?.name ?? null;
  const dbPhone = user?.phone ?? user?.phoneNumber ?? null; // Handle different field names
  const dbEmail = user?.email ?? null;
  const isGoogleUser = user?.provider === "google" || (!!user?.email && user?.email.includes("@") && !dbPhone);
  
  const avatarSrc = user?.image ?? user?.profilePic ?? null;
  const avatarFallback = (dbUsername ?? dbEmail ?? "?")[0].toUpperCase();

  const overlayRef = useRef(null);

  // Form state
  const [phone, setPhone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [username, setUsername] = useState("");
  
  // Location method: "map" or "manual"
  const [locationMethod, setLocationMethod] = useState("map");
  const [showMap, setShowMap] = useState(false);
  const [mapCoords, setMapCoords] = useState(null);
  const [mapAddress, setMapAddress] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form
  useEffect(() => {
    if (isOpen && user) {
      console.log("🔍 User data:", { user, dbPhone, dbUsername, isGoogleUser });
      
      setPhone(dbPhone || "");
      setIsEditingPhone(!dbPhone);
      setUsername(dbUsername || "");
      setLocationMethod("map");
      setShowMap(false);
      setMapCoords(null);
      setMapAddress("");
      setManualAddress("");
      setShowConfirmation(false);
      setErrors({});
    }
  }, [isOpen, user, dbPhone, dbUsername, isGoogleUser]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && !showMap) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, showMap]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleMapConfirm = ({ coords, address }) => {
    setMapCoords(coords);
    setMapAddress(address);
    setShowMap(false);
    setErrors(prev => ({ ...prev, location: null }));
  };

  const validatePhone = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) return "Phone must be at least 10 digits";
    if (cleaned.length > 15) return "Phone number too long";
    return null;
  };

  const validateForm = (formData) => {
    const newErrors = {};

    if (!dbUsername && !username.trim()) {
      newErrors.username = "Name is required";
    }

    const phoneError = validatePhone(phone);
    if (phoneError) newErrors.phone = phoneError;

    if (!formData.get("requirement")?.trim()) {
      newErrors.requirement = "Please describe your requirement";
    }

    // Validate location based on method
    if (locationMethod === "map") {
      if (!mapCoords) {
        newErrors.location = "Please pin your location on the map";
      }
    } else {
      if (!manualAddress.trim()) {
        newErrors.manualAddress = "Please enter your full address";
      }
    }

    const dateValue = formData.get("date");
    if (dateValue) {
      const selectedDate = new Date(dateValue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past";
      }
    }

    return newErrors;
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const payload = {
      username: dbUsername || username.trim(),
      phone: phone.trim(),
      requirement: formData.get("requirement").trim(),
      date: formData.get("date") || null,
      location: locationMethod === "map" ? {
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
    };

    console.log("📤 Submitting:", payload);

    try {
      // TODO: API call
      // const res = await fetch("/api/arrangements", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      // if (!res.ok) throw new Error("Failed");
      
      setShowConfirmation(true);
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({ submit: "Failed to submit. Please try again." });
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    onClose();
  };

  if (!isOpen || status === "loading" || status === "unauthenticated") return null;

  return (
    <>
      {showMap && (
        <MapPicker
          initialCoords={mapCoords}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-s16"
      >
        <div className="relative w-full max-w-lg bg-white rounded-r32 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          
          {/* Header */}
          <div className="bg-[#F3EAF5] px-s24 py-s24 flex items-start justify-between gap-s16 flex-shrink-0">
            <div>
              <h2 className="heading-h4 text-main leading-tight">Request a Custom Arrangement</h2>
              <p className="body-small text-secondary mt-s4">Tell us what you need — we'll handle the rest.</p>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-main transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <div className="overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="px-s24 py-s24 flex flex-col gap-s16">
              
              {/* Global error */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-r16 px-s16 py-s16 flex items-start gap-s8">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <p className="body-small text-red-700">{errors.submit}</p>
                </div>
              )}

              {/* Name */}
              <Field label="Your Name" required error={errors.username}>
                {dbUsername ? (
                  <div className="flex items-center gap-s16 rounded-r16 border border-[#E0D4E3] bg-[#FAFAFA] px-s16 py-s16">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={dbUsername} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 bg-[#E8D8EA] flex items-center justify-center text-[#9B59B6] text-xs font-semibold">
                        {avatarFallback}
                      </div>
                    )}
                    <span className="body-default text-main flex-1">{dbUsername}</span>
                    <span className="body-small text-secondary/50 italic">auto-filled</span>
                  </div>
                ) : (
                  <TextInput
                    name="username"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrors(prev => ({ ...prev, username: null }));
                    }}
                    placeholder="Enter your full name"
                    error={errors.username}
                  />
                )}
              </Field>

              {/* Phone - Always show, always editable */}
              <Field 
                label="Phone Number" 
                required 
                error={errors.phone}
                hint="Required for booking confirmation"
              >
                <div className="flex gap-s8">
                  <TextInput
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrors(prev => ({ ...prev, phone: null }));
                    }}
                    placeholder="+91 98765 43210"
                    error={errors.phone}
                  />
                  {dbPhone && phone !== dbPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhone(dbPhone);
                        setErrors(prev => ({ ...prev, phone: null }));
                      }}
                      className="px-s16 py-s16 rounded-r16 border border-[#E0D4E3] body-small text-secondary hover:bg-[#F3EAF5] transition-colors flex-shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </Field>

              {/* Requirement */}
              <Field
                label="Describe Your Requirement"
                required
                error={errors.requirement}
                hint="Pooja type, occasion, number of people, etc."
              >
                <textarea
                  name="requirement"
                  required
                  rows={4}
                  onChange={() => setErrors(prev => ({ ...prev, requirement: null }))}
                  placeholder="e.g. Ganesh Pooja for new home, full samagri, ~15 people."
                  className={`w-full rounded-r16 border ${errors.requirement ? 'border-red-500' : 'border-[#E0D4E3]'} px-s16 py-s16 body-default text-main placeholder:text-secondary/40 focus:outline-none focus:border-[#9B59B6] transition-colors resize-none`}
                />
              </Field>

              {/* Date */}
              <Field label="Preferred Date" error={errors.date}>
                <TextInput
                  name="date"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={() => setErrors(prev => ({ ...prev, date: null }))}
                  error={errors.date}
                />
              </Field>

              {/* Location - Choose method */}
              <div className="flex flex-col gap-s16">
                <p className="body-small font-medium text-main">
                  Your Location <span className="text-red-500">*</span>
                </p>

                {/* Method selector */}
                <div className="flex gap-s8 p-s4 bg-[#F3EAF5] rounded-r16">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMethod("map");
                      setErrors(prev => ({ ...prev, manualAddress: null }));
                    }}
                    className={`flex-1 py-s8 px-s16 rounded-r12 body-small font-medium transition-all ${
                      locationMethod === "map"
                        ? "bg-white text-[#9B59B6] shadow-sm"
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
                    className={`flex-1 py-s8 px-s16 rounded-r12 body-small font-medium transition-all ${
                      locationMethod === "manual"
                        ? "bg-white text-[#9B59B6] shadow-sm"
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
                        className={`flex items-center gap-s16 rounded-r20 border-2 ${errors.location ? 'border-red-500' : 'border-dashed border-[#C39BD3]'} bg-[#F9F4FB] px-s16 py-s16 w-full text-left hover:bg-[#F3EAF5] transition-colors group`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#E8D8EA] flex items-center justify-center flex-shrink-0 group-hover:bg-[#D8BFE0] transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2.2">
                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="body-default font-semibold text-[#9B59B6]">Pin your location</span>
                          <span className="body-small text-secondary">Tap to open map</span>
                        </div>
                      </button>
                    ) : (
                      <div className="rounded-r20 border border-[#C39BD3] bg-[#F9F4FB] px-s16 py-s16 flex items-start gap-s16">
                        <div className="w-9 h-9 rounded-full bg-[#E8D8EA] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2.2">
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
                          className="body-small font-medium text-[#9B59B6] hover:underline flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Manual address method */}
                {locationMethod === "manual" && (
                  <Field
                    label="Full Address"
                    required
                    error={errors.manualAddress}
                    hint="House no., street, area, city, pincode"
                  >
                    <textarea
                      name="manualAddress"
                      required
                      rows={4}
                      value={manualAddress}
                      onChange={(e) => {
                        setManualAddress(e.target.value);
                        setErrors(prev => ({ ...prev, manualAddress: null }));
                      }}
                      placeholder="e.g. 45 Sharma Villa, Civil Lines, Kanpur, Uttar Pradesh - 208001"
                      className={`w-full rounded-r16 border ${errors.manualAddress ? 'border-red-500' : 'border-[#E0D4E3]'} px-s16 py-s16 body-default text-main placeholder:text-secondary/40 focus:outline-none focus:border-[#9B59B6] transition-colors resize-none`}
                    />
                  </Field>
                )}

                <p className="body-small text-secondary/60 -mt-s8">
                  {locationMethod === "map" 
                    ? "GPS coordinates will be used for live pandit tracking" 
                    : "Pandit will contact you for exact directions"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-s16 pt-s4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-r32 px-s24 py-s16 border border-[#E0D4E3] body-default text-secondary hover:bg-[#F3EAF5] transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="tertiary"
                  className="flex-1 !rounded-r32 !px-s24 !py-s16"
                >
                  Submit Request →
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showConfirmation && <ConfirmationPopup onClose={handleConfirmationClose} />}
    </>
  );
}

export default RequestArrangementModal;
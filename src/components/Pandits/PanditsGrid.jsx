"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

function PanditsGrid({
  sectionTitle = "All Pandits",
  pandits = [],
  requestedCalls = {},
  loadingId,
  onRequestCall,
  userId,
}) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [sortBy, setSortBy] = useState("name");
  const [showSort, setShowSort] = useState(false);

  // ✅ Same login check as CallExpertsSection
  const isLoggedIn = !!session?.user || !!userId;

  function handleCallClick(pandit) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    onRequestCall(pandit);
  }

  // Sort pandits
  const sortedPandits = [...pandits].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "rate":
        return (a.ratePerMin || 0) - (b.ratePerMin || 0);
      case "experience":
        return (b.experience || 0) - (a.experience || 0);
      default:
        return 0;
    }
  });

  return (
    <section className="flex flex-col gap-s24 pb-s40">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-s16 lg:px-s32">
        <h2 className="heading-h5 text-main">{sectionTitle}</h2>

        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-s4 text-[13px] text-primary-light"
          >
            Sort
            <ChevronDown size={14} />
          </button>

          {showSort && (
            <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg p-2 z-10">
              {[
                { value: "name", label: "Name" },
                { value: "rate", label: "Rate" },
                { value: "experience", label: "Experience" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setShowSort(false);
                  }}
                  className={`
                    block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100
                    ${sortBy === option.value ? "bg-primary-main/10 text-primary-main" : ""}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PANDITS LIST */}
      <div className="flex flex-col gap-s16 px-s16 lg:px-s32">
        
        {/* Empty State */}
        {sortedPandits.length === 0 && (
          <p className="text-center text-secondary py-4">
            No experts available right now
          </p>
        )}

        {/* Pandits */}
        {sortedPandits.map((pandit) => {
          const requested = !!requestedCalls[pandit.id];
          const loading = loadingId === pandit.id;

          return (
            <div
              key={pandit.id}
              className="flex items-center justify-between gap-s16 p-s16 rounded-r32 bg-[#F4E7DD] transition-all duration-300 hover:shadow-md"
            >
              {/* LEFT */}
              <div className="flex items-center gap-s16">
                
                {/* Avatar */}
                <div className="relative rounded-full w-s56 h-s56 overflow-hidden bg-[#D9C9BC] flex-shrink-0">
                  {pandit.profilePic ? (
                    <Image
                      src={pandit.profilePic}
                      alt={pandit.name}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-main font-semibold text-lg">
                      {pandit.name?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[12px] text-[#4A9B67]">● Online</span>
                  <h3 className="heading-h6 font-medium text-main leading-[120%]">
                    {pandit.name}
                  </h3>
                  <p className="caption text-secondary">{pandit.speciality}</p>
                </div>
              </div>

              {/* BUTTON */}
              <Button
                variant="primary"
                disabled={loading || requested}
                onClick={() => handleCallClick(pandit)}
                className="!rounded-full whitespace-nowrap !px-s16 !py-s10 disabled:opacity-50"
              >
                {loading
                  ? "..."
                  : requested
                  ? "Requested ✓"
                  : !isLoggedIn
                  ? "Login to Call"
                  : "Call Now"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* ✅ Same login nudge as CallExpertsSection */}
      {!isLoggedIn && (
        <p className="text-center text-secondary text-[13px] px-s16">
          <button
            onClick={() => router.push("/login")}
            className="text-primary-main underline"
          >
            Login
          </button>{" "}
          to consult with our experts
        </p>
      )}
    </section>
  );
}

export default PanditsGrid;
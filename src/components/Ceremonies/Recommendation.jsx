"use client";

import { useRouter } from "next/navigation";
import React from "react";
import Image from "next/image";

function Recommendation({
  categoryTitle = "Category",
  sectionTitle = "Recommended for You",
  actionText = "View All",
  onActionClick,
  categories = [],
  ritualsByCategory = {},
}) {
  const router = useRouter();

  // ✅ Handle ritual item click
  const handleRitualClick = (itemId) => {
    router.push(`/ceremonies/cermony/${itemId}`);
  };

  // ✅ Handle "View All" click
  const handleViewAllClick = () => {
    if (onActionClick) {
      onActionClick();
    } else {
      router.push("/ceremonies/cermony");
    }
  };

  return (
    <section className="flex flex-col gap-s40">
      {/* Recommended */}
      <div className="flex flex-col gap-s32">
        {/* Header */}
        <div className="flex items-center justify-between px-s16">
          <h3 className="heading-h5 text-main">
            {sectionTitle}
          </h3>

          <button
            className="body-small text-primary-light hover:opacity-80 transition-all"
            onClick={handleViewAllClick}
          >
            {actionText}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-s16 gap-y-s32 px-s16">
          {categories.flatMap((category) =>
            ritualsByCategory[category]?.map((item) => (
              <div
                key={item.id}
                onClick={() => handleRitualClick(item.id)}
                className="flex flex-col gap-s16 group cursor-pointer"
              >
                {/* IMAGE */}
                <div className="relative w-full aspect-[1/0.72] rounded-r24 overflow-hidden bg-[#EDE2D8]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
                  
                  {/* ✅ Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* CONTENT */}
                <div className="flex flex-col gap-s8">
                  <h4 className="text-[15px] lg:text-[20px] font-semibold text-main leading-[130%] group-hover:text-primary-main transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-[13px] lg:text-base text-secondary leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {/* ✅ Click indicator */}
                  <div className="flex items-center gap-s4 text-primary-light opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1 mt-s4">
                    <span className="text-xs font-medium">View Details</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default Recommendation;
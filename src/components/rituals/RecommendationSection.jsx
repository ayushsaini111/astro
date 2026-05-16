import React from "react";
import Image from "next/image";

function RecommendationSection({
  categoryTitle = "Category",
  sectionTitle = "Recommended for You",
  actionText = "View All",
  categories = [],
  rituals = [],
}) {
  return (
    <section className="flex flex-col gap-s40">

      {/* Categories */}
      <div className="flex flex-col gap-s24 px-s16 lg:px-s40">

        <h3 className="heading-h5 text-main">
          {categoryTitle}
        </h3>

        <div
          className="
            flex
            items-center
            gap-s16
            overflow-x-auto
            hide-scrollbar
          "
        >

          {categories.map((category) => (
            <button
              key={category}
              className="
                px-s16
                py-s8
                rounded-r16
                bg-[#E8D8CC]
                text-main
                body-small
                whitespace-nowrap
                hover:bg-[#DDC9BB]
                transition-all
                duration-300
              "
            >
              {category}
            </button>
          ))}

        </div>

      </div>

      {/* Recommended */}
      <div className="flex flex-col gap-s32">

        {/* Header */}
        <div
          className="
            flex
            items-center
            justify-between
            px-s16
            lg:px-s40
          "
        >

          <h3 className="heading-h5 text-main">
            {sectionTitle}
          </h3>

          <button
            className="
              body-small
              text-primary-light
              hover:opacity-80
              transition-all
            "
          >
            {actionText}
          </button>

        </div>

        {/* Mobile Slider / Desktop Grid */}
        <div
          className="
            flex
            lg:grid
            lg:grid-cols-2
            xl:grid-cols-3
            gap-s24
            overflow-x-auto
            lg:overflow-visible
            hide-scrollbar
            px-s16
            lg:px-s40
          "
        >

          {rituals.map((item) => (
            <div
              key={item.id}
              className="
                min-w-[240px]
                lg:min-w-0
                flex
                flex-col
                gap-s16
                group
              "
            >

              {/* Image */}
              <div
                className="
                  relative
                  w-full
                  h-[160px]
                  lg:h-[240px]
                  xl:h-[280px]
                  rounded-r24
                  overflow-hidden
                "
              >

                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="
                    (max-width: 768px) 240px,
                    (max-width: 1280px) 50vw,
                    33vw
                  "
                  className="
                    object-cover
                    transition-transform
                    duration-500
                    group-hover:scale-105
                    pointer-events-none
                  "
                />

              </div>

              {/* Content */}
              <div className="flex flex-col gap-s8">

                <h4
                  className="
                    heading-h6
                    lg:heading-h5
                    text-main
                  "
                >
                  {item.title}
                </h4>

                <p
                  className="
                    body-small
                    lg:body-default
                    text-secondary
                    leading-relaxed
                  "
                >
                  {item.description}
                </p>

                <button
                  className="
                    group/link
                    body-small
                    text-primary-light
                    font-medium
                    inline-flex
                    items-center
                    gap-1
                    hover:opacity-80
                    transition-all
                    duration-200
                    cursor-pointer
                    w-fit
                  "
                >
                  Learn More

                  <span
                    className="
                      transition-transform
                      duration-200
                      group-hover/link:translate-x-1
                    "
                  >
                    →
                  </span>

                </button>

              </div>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}

export default RecommendationSection;
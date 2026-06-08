"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import ExpertFinderModal from "./ExpertFinderModal";

import {
  ShieldCheck,
  Headphones,
  Lock,
} from "lucide-react";

const tags = [
  "Career Clarity",
  "Stress & Anxiety",
  "Relationships",
  "Business",
];

const features = [
  {
    id: 1,
    title: "Verified Experts",
    subtitle: "Trusted & experienced",
    icon: ShieldCheck,
  },
  {
    id: 2,
    title: "Private & Secure",
    subtitle: "100% confidential",
    icon: Headphones,
  },
  {
    id: 3,
    title: "Instant Connection",
    subtitle: "Talk in minutes",
    icon: Lock,
  },
];

function ConsultBottomSection({ pandits = [], onRequestCall, loadingId }) {
  const [showFinder, setShowFinder] = useState(false);

  return (
    <>
      <section className="flex flex-col gap-s40">

        {/* Help Card */}
        <div
          className="
            bg-[#D8C3E0]
            rounded-r40
            p-s24 mx-s16
            lg:p-s32
            min-h-[180px]
            lg:min-h-[260px]
            flex
            flex-col
            justify-between
          "
        >

          <h2 className="heading-h3 text-main">
            Need help choosing?
          </h2>

          <div
            className="
              flex
              items-end
              justify-between
              gap-s24
            "
          >

            <p
              className="
                body-default
                text-secondary
                max-w-[140px]
              "
            >
              Get matched with the right expert
            </p>

            <Button 
              variant="primary"
              onClick={() => setShowFinder(true)}
            >
              Find My Expert
            </Button>

          </div>

        </div>

        {/* Tags */}
        <div className="flex flex-col gap-s24">

          <h2 className="heading-h5 text-main px-s16">
            People recently consulted for
          </h2>

          <div
            className="
              flex
              gap-s16 px-s16
              overflow-x-auto
              hide-scrollbar
            "
          >

            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="
                  px-s16
                  py-s8
                  rounded-full
                  bg-[#5B9B69]
                  text-white
                  body-small
                  whitespace-nowrap
                "
              >
                {tag}
              </button>
            ))}

          </div>

        </div>

        {/* Features */}
        <div
          className="
            grid
            grid-cols-3
            px-s16
          "
        >

          {features.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="
                  rounded-r24
                  p-s6
                  flex
                  gap-[3px]
                  items-center
                "
              >

                {/* Icon */}
                <div
                  className="
                    w-s32
                    h-s32
                    rounded-full
                    border
                    border-secondary
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                  "
                >
                  <Icon
                    size={16}
                    className="text-main"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-[2px]">

                  <h4
                    className="
                      text-[8px]
                      text-main
                      font-medium
                      leading-tight
                    "
                  >
                    {item.title}
                  </h4>

                  <p
                    className="
                      text-[6px]
                      text-secondary
                      leading-tight
                    "
                  >
                    {item.subtitle}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </section>

      {/* Expert Finder Modal */}
      <ExpertFinderModal
        isOpen={showFinder}
        onClose={() => setShowFinder(false)}
        pandits={pandits}
        onRequestCall={onRequestCall}
        loadingId={loadingId}
      />
    </>
  );
}

export default ConsultBottomSection;
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import RequestArrangementModal from "@/components/Ceremonies/RequestArrangementModal";

function CustomArrangementSection() {
  const { status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRequestArrangement = () => {
    // Don't do anything while auth is loading
    if (status === "loading") return;

    // If not logged in, redirect to login page
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    // If authenticated, open the modal
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="px-s16 lg:px-0">
        <div
          className="
            relative
            overflow-hidden
            rounded-r32
            min-h-[280px]
            lg:min-h-[420px]
          "
        >
          {/* Background Image */}
          <Image
            src="/Ceremonies/light-purple-bg.png"
            alt="Background"
            fill
            priority
            sizes="(max-width:1024px) 100vw, 1200px"
            className="object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-[#E8D8EA]/80" />

          {/* Content */}
          <div
            className="
              relative z-10
              h-full
              flex flex-col justify-between
              gap-s40
              px-s24 py-s24
              lg:px-s40 lg:py-s40
            "
          >
            {/* TOP */}
            <div className="flex flex-col gap-s32">

              {/* Heading */}
              <h2
                className="
                  heading-h3 text-main
                  max-w-[260px] lg:max-w-[520px]
                  leading-[1.1]
                "
              >
                Didn't find a suitable package?
              </h2>

              {/* Bubble */}
              <div
                className="
                  ml-auto relative
                  bg-[#FFF7EE]
                  rounded-r24
                  px-s16 py-s16
                  max-w-[240px] lg:max-w-[320px]
                  shadow-[0_8px_24px_rgba(0,0,0,0.06)]
                "
              >
                <p className="body-default text-main leading-relaxed">
                  Tell us what you need and we'll arrange it for you
                </p>

                {/* Tail */}
                <div
                  className="
                    absolute -bottom-[6px] right-s24
                    w-s16 h-s16
                    rotate-45
                    bg-[#FFF7EE]
                  "
                />
              </div>
            </div>

            {/* Button — opens modal with auth check */}
            <Button
              variant="tertiary"
              onClick={handleRequestArrangement}
              disabled={status === "loading"}
              className="
                !rounded-r32
                !px-s24 !py-s12
                lg:!px-s32 lg:!py-s16
                w-fit
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >
              {status === "loading" ? "Loading..." : "Request Arrangement →"}
            </Button>

          </div>
        </div>
      </section>

      {/* Modal - only renders when user is authenticated */}
      {status === "authenticated" && (
        <RequestArrangementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default CustomArrangementSection;
import React from "react";

import PageHeader from "@/components/PageHeader";
import Recommendation from "@/components/Ceremonies/Recommendation";
import CeremonyHeroSection from "@/components/Ceremonies/CeremonyHeroSection";
import HassleFreeSection from "@/components/Ceremonies/HassleFreeSection";
import CustomArrangementSection from "@/components/Ceremonies/CustomArrangementSection";
import GuidanceSection from "@/components/Ceremonies/GuidanceSection";
function CeremoniesPage() {
  return (
    <main
      className="
        min-h-screen
        bg-background
        pb-[120px]

        lg:pb-s64
      "
    >

      {/* Header */}
      <PageHeader
        title="Ceremonies"
        subtitle="Talk to verified spiritual experts"
      />

      {/* Content */}
      <div
        className="
          max-w-7xl
          mx-auto

          flex
          flex-col
          gap-s40
        "
      >

        {/* Hero */}
        <CeremonyHeroSection />
        <HassleFreeSection/>
        <Recommendation
          categories={[
            "Career",
            "Finance",
            "Relationships",
            "Wealth",
          ]}
          rituals={[
            {
              id: 1,
              title: "Career Growth Pooja",
              description:
                "Enhance focus, remove obstacles and attract new opportunities.",
              image: "/Rituals/ganeshji.jpg",
            },
            {
              id: 2,
              title: "Wealth Ritual",
              description:
                "Attract abundance and positive energy.",
              image: "/Rituals/coconut2.jpg",
            },
          ]}
        />

        <CustomArrangementSection/>
        <GuidanceSection/>

      </div>

    </main>
  );
}

export default CeremoniesPage;
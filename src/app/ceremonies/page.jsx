import React from "react";
import PageHeader from "@/components/PageHeader";
import CeremonyHeroSection from "@/components/Ceremonies/CeremonyHeroSection";
import HassleFreeSection from "@/components/Ceremonies/HassleFreeSection";
import Recommendation from "@/components/Ceremonies/Recommendation";
import CustomArrangementSection from "@/components/Ceremonies/CustomArrangementSection";
import GuidanceSection from "@/components/Ceremonies/GuidanceSection";

export default function CeremoniesPage() {
  const ritualsByCategory = {
    "Career": [
      { id: 1, title: "Career Growth Pooja", description: "Online spiritual ceremony to enhance focus and attract opportunities.", image: "/Rituals/ganeshji.jpg" },
      { id: 3, title: "Saraswati Pooja", description: "Online wisdom and knowledge enhancement ceremony.", image: "/Rituals/diya.jpg" },
    ],
    "Finance": [
      { id: 2, title: "Wealth Ritual", description: "Online abundance ceremony for financial prosperity.", image: "/Rituals/coconut2.jpg" },
      { id: 6, title: "Lakshmi Pooja", description: "Online Goddess Lakshmi worship for financial stability.", image: "/logo.jpg" },
    ],
  
  };

  return (
    <main className="min-h-screen bg-background pb-[120px] lg:pb-s64">
      <PageHeader
        title="Ceremonies"
        subtitle="Talk to verified spiritual experts"
      />

      <div className="max-w-7xl mx-auto flex flex-col gap-s40">
        <CeremonyHeroSection />
        <HassleFreeSection/>
        <Recommendation
          categories={["Career", "Finance", "Relationships"]}
          ritualsByCategory={ritualsByCategory}
        />
        <CustomArrangementSection/>
        <GuidanceSection/>
      </div>
    </main>
  );
}
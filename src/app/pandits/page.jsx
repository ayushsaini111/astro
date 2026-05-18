import { prisma } from "@/lib/prisma";

import ProductsHeader from "@/components/ProductsHeader";

import PanditsClient from "@/components/Pandits/PanditsClient";

export default async function PanditsPage() {
  /* FETCH REAL PANDITS */
  const pandits = await prisma.pandit.findMany({
    where: {
      isAvailable: true,
    },

    orderBy: {
      createdAt: "desc",
    },

select: {
  id: true,
  name: true,
  speciality: true,
  profilePic: true,
  isAvailable: true,
},
  });

  return (
    <main
      className="
        min-h-screen

       max-w-7xl mx-auto

        flex
        flex-col

        gap-s32

        pb-[120px]
      "
    >

      {/* HEADER */}
      <ProductsHeader
        title="Pandits"
        subtitle="Connect with verified and experienced pandits"
        showSubtitle={true}
        showTabs={true}
        tabs={[
          "All",
          "Vedic",
          "Puja",
          "Astrology",
          "Vastu",
        ]}
        activeTab="All"
        searchPlaceholder="Search pandit..."
      />

      {/* CLIENT */}
      <PanditsClient pandits={pandits} />

    </main>
  );
}
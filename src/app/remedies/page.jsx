import React from "react";

import PageHeader from "@/components/PageHeader";

import RemediesSection from "@/components/remedies/RemediesSection";

function RemediesPage() {
  return (
    <main
      className="
        min-h-screen
        bg-background
space-y-s24
        pb-[120px]

        lg:pb-s64
      "
    >

      {/* Header */}
      <PageHeader
        title="Remedies"
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

        <RemediesSection />

      </div>

    </main>
  );
}

export default RemediesPage;
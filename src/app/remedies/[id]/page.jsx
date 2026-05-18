import React from "react";

import { remedies } from "@/data/remedies";

import RemedyDetailsPageContent from "@/components/remedies/subremedy/RemedyDetailsPageContent";

export default async function RemedyPage({
  params,
}) {
  const { id } = await params;

  const remedy = remedies.find(
    (item) => item.id === Number(id)
  );

  if (!remedy) {
    return (
      <div>
        Remedy not found
      </div>
    );
  }

  return (
    <RemedyDetailsPageContent
      remedy={remedy}
    />
  );
}
import { Suspense } from "react";
import RitualPackagesContent from "./RitualPackagesContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RitualPackagesContent />
    </Suspense>
  );
}
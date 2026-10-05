"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { LayeredHistoricalMap } from "@/components/saas/map-layered-view";

export default function MapPage() {
  const router = useRouter();

  return (
    <div className="map-page h-full min-h-0 w-full">
      <Suspense fallback={null}>
        <LayeredHistoricalMap onClose={() => router.push("/home")} />
      </Suspense>
    </div>
  );
}

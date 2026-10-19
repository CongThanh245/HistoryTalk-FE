"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { LayeredHistoricalMap } from "@/components/saas/map-layered-view";

/** Bản đồ lớp: class & school content only (Teacher + School Student). */
export default function ClassMapPage() {
  const router = useRouter();

  return (
    <div className="map-page h-full min-h-0 w-full">
      <Suspense fallback={null}>
        <LayeredHistoricalMap mode="class" onClose={() => router.push("/home")} />
      </Suspense>
    </div>
  );
}

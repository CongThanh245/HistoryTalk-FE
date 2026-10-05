"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { LayeredHistoricalMap } from "@/components/saas/map-layered-view";
import { ROUTES } from "@/constants/routes";

/** School Admin: global battle map (read-only) + any class layer of the school (read-only). */
export default function SchoolMapPage() {
  const router = useRouter();

  return (
    <div className="map-page h-full min-h-0 w-full">
      <Suspense fallback={null}>
        <LayeredHistoricalMap onClose={() => router.push(ROUTES.SCHOOL.HOME)} />
      </Suspense>
    </div>
  );
}

"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayeredHistoricalMap } from "@/components/saas/map-layered-view";
import { ROUTES } from "@/constants/routes";

export default function MapPage() {
  const router = useRouter();

  return (
    <div className="map-page h-full min-h-0 w-full">
      <Suspense fallback={null}>
        <BattleMap onClose={() => router.push("/home")} />
      </Suspense>
    </div>
  );
}

/** Old "Bản đồ lớp" links (`/map?layer=class`) now live on their own page. */
function BattleMap({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const legacyClassMap = params.get("layer") === "class";

  useEffect(() => {
    if (!legacyClassMap) return;
    const query = new URLSearchParams(params.toString());
    query.delete("layer");
    const suffix = query.toString();
    router.replace(suffix ? `${ROUTES.CLASS_MAP}?${suffix}` : ROUTES.CLASS_MAP);
  }, [legacyClassMap, params, router]);

  if (legacyClassMap) return null;
  return <LayeredHistoricalMap onClose={onClose} />;
}

"use client";

import { useRouter } from "next/navigation";
import { HistoricalMapModal } from "@/components/historical-map/HistoricalMapModal";

export default function MapPage() {
  const router = useRouter();

  return (
    <div className="map-page h-full min-h-0 w-full">
      <HistoricalMapModal isOpen={true} onClose={() => router.push("/home")} />
    </div>
  );
}

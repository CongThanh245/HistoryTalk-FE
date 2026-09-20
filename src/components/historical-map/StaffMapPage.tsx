"use client";

import { useRouter } from "next/navigation";
import { HistoricalMapModal } from "./HistoricalMapModal";

export function StaffMapPage({ closeHref }: { closeHref: string }) {
  const router = useRouter();
  return (
    <div className="map-page h-full min-h-0 w-full">
      <HistoricalMapModal isOpen onClose={() => router.push(closeHref)} />
    </div>
  );
}

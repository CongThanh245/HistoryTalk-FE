"use client";

import { useRouter } from "next/navigation";
import { HistoricalMapModal } from "@/components/historical-map/HistoricalMapModal";

export default function MapPage() {
  const router = useRouter();

  return (
    <HistoricalMapModal isOpen={true} onClose={() => router.push("/home")} />
  );
}

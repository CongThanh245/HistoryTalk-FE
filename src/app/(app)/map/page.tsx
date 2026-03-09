// app/(app)/map/page.tsx
"use client";
import { useEffect, useState } from "react";
import { HistoricalMapModal } from "@/components/historical-map/HistoricalMapModal";

export default function MapPage() {
  const [open, setOpen] = useState(true); // auto open khi vào trang
  return <HistoricalMapModal isOpen={open} onClose={() => setOpen(true)} />;
  // onClose giữ true để không bao giờ đóng được bằng X — hoặc router.back()
}

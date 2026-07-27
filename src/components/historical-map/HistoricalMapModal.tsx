"use client";

// components/historical-map/HistoricalMapModal.tsx
// Fullscreen modal chứa toàn bộ map experience
// + Timeline (year slider) — kéo qua các năm, marker fade in/out theo year range của landmark

import React, { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { X, Map, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Landmark } from "@/services/landmark.service";
import { LandmarkPanel } from "./LandmarkPanel";
import { EventDetailPanel } from "./EventDetailPanel";
import { TimelineSlider } from "./TimelineSlider";
import { useLandmarks } from "@/features/landmark/hooks";

// Dynamic import LeafletMap để tránh SSR
const LeafletMap = dynamic(
  () => import("./LeafletMap").then((m) => ({ default: m.LeafletMap })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#f5f1ea]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-accent-gold" />
          <p className="text-sm text-content-muted">
            Đang tải bản đồ...
          </p>
        </div>
      </div>
    ),
  },
);

interface HistoricalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_YEAR = 938; // Trận Bạch Đằng — trận đầu tiên có ý nghĩa lớn
const VIETNAM_VIEW_BOUNDS = {
  minLat: 7.1,
  maxLat: 23.7,
  minLng: 101.6,
  maxLng: 116.3,
};

function isInsideVietnamView(landmark: Landmark) {
  return (
    landmark.lat >= VIETNAM_VIEW_BOUNDS.minLat &&
    landmark.lat <= VIETNAM_VIEW_BOUNDS.maxLat &&
    landmark.lng >= VIETNAM_VIEW_BOUNDS.minLng &&
    landmark.lng <= VIETNAM_VIEW_BOUNDS.maxLng
  );
}

export function HistoricalMapModal({
  isOpen,
  onClose,
}: HistoricalMapModalProps) {
  // Selection state
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(
    null,
  );
  const [selectedContextId, setSelectedContextId] = useState<string | null>(
    null,
  );

  // Year (timeline) state
  const [currentYear, setCurrentYear] = useState<number>(DEFAULT_YEAR);

  const { data: allLandmarksRaw = [], isLoading } = useLandmarks({});

  const allLandmarks = useMemo(
    () => allLandmarksRaw.filter(isInsideVietnamView),
    [allLandmarksRaw],
  );

  // Danh sách năm có trận (sorted, unique) — dùng cho discrete slider
  const battleYears = useMemo(() => {
    const set = new Set<number>();
    allLandmarks.forEach((lm) => set.add(lm.yearStart));
    return Array.from(set).sort((a, b) => a - b);
  }, [allLandmarks]);

  // Filter landmarks theo currentYear (exact match)
  const visibleLandmarks = useMemo(
    () =>
      allLandmarks.filter(
        (lm) => lm.yearStart <= currentYear && lm.yearEnd >= currentYear,
      ),
    [allLandmarks, currentYear],
  );

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Callbacks ──────────────────────────────────────────────
  const handleSelectLandmark = useCallback((landmark: Landmark) => {
    setSelectedLandmark(landmark);
    setSelectedContextId(null);
  }, []);

  const handleCloseLandmark = useCallback(() => {
    setSelectedLandmark(null);
    setSelectedContextId(null);
  }, []);

  const handleYearChange = useCallback(
    (year: number) => {
      setCurrentYear(year);
      if (
        selectedLandmark &&
        (selectedLandmark.yearStart > year || selectedLandmark.yearEnd < year)
      ) {
        setSelectedLandmark(null);
        setSelectedContextId(null);
      }
    },
    [selectedLandmark],
  );

  // ── Render ─────────────────────────────────────────────────
  const panelOpen = !!selectedLandmark;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background:
          "linear-gradient(180deg, #2f1d10 0%, #4b2d15 42%, #2a1a0e 100%)",
      }}
    >
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 h-14 z-10"
        style={{
          background:
            "linear-gradient(90deg, #3b2312 0%, #6e461f 45%, #3b2312 100%)",
          borderBottom: "1px solid rgba(246, 209, 132, 0.28)",
          boxShadow: "0 2px 16px rgba(35, 20, 8, 0.35)",
        }}
      >
        <Map size={18} className="text-[#f1c66f]" />
        <div>
          <h2 className="font-bold text-sm leading-tight text-[#ffe8b1]">
            Bản đồ lịch sử Việt Nam
          </h2>
          <p className="text-xs text-[rgba(255,232,177,0.7)]">
            {isLoading
              ? "Đang tải..."
              : `${visibleLandmarks.length}/${allLandmarks.length} di tích trong lãnh thổ Việt Nam`}
          </p>
        </div>

        <button
          onClick={onClose}
          className="ml-auto p-2 rounded-md transition-colors hover:bg-white/10 text-[rgba(255,232,177,0.78)]"
          aria-label="Đóng bản đồ"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main content: map + panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map */}
        <div
          className={cn(
            "flex-1 relative transition-all duration-300",
            panelOpen && "hidden md:block"
          )}
        >
          <LeafletMap
            landmarks={visibleLandmarks}
            selectedLandmarkId={selectedLandmark?.landmarkId ?? null}
            onSelectLandmark={handleSelectLandmark}
          />

          {/* Empty state */}
          {!isLoading && visibleLandmarks.length === 0 && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-4 rounded-xl text-sm font-medium pointer-events-none text-center max-w-[320px] bg-[rgba(74,45,20,0.92)] text-[#ffe8b1] shadow-[0_12px_30px_rgba(50,26,8,0.28)] border border-[rgba(246,209,132,0.32)] backdrop-blur-[8px]"
            >
              <div className="text-2xl mb-1">🗺️</div>
              Chưa có di tích nào ở năm{" "}
              <span className="text-[#f1c66f]">
                {currentYear < 0 ? `${Math.abs(currentYear)} TCN` : currentYear}
              </span>
              <div className="text-xs mt-1 font-normal text-[rgba(255,232,177,0.7)]">
                Hãy kéo trục thời gian đến mốc khác
              </div>
            </div>
          )}
        </div>

        {/* Side panel - full width on mobile, fixed 360px on md+ */}
        <div
          className={cn(
            "shrink-0 overflow-hidden transition-all duration-300",
            panelOpen
              ? "w-full md:w-[360px] border-l border-card-light-border shadow-[-4px_0_16px_rgba(27,38,50,0.08)]"
              : "w-0"
          )}
        >
          {selectedLandmark && (
            <div className="w-full md:w-[360px] h-full overflow-hidden">
              {selectedContextId ? (
                <EventDetailPanel
                  contextId={selectedContextId}
                  onBack={() => setSelectedContextId(null)}
                />
              ) : (
                <LandmarkPanel
                  landmark={selectedLandmark}
                  onClose={handleCloseLandmark}
                  onSelectEvent={setSelectedContextId}
                  selectedContextId={selectedContextId}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timeline (đáy) */}
      <TimelineSlider
        currentYear={currentYear}
        onChange={handleYearChange}
        battleYears={battleYears}
        visibleCount={visibleLandmarks.length}
      />

      {/* Custom Leaflet tooltip style */}
      <style>{`
        .leaflet-tooltip-custom {
          background: #f6dda7 !important;
          border: 1px solid rgba(76, 44, 18, 0.35) !important;
          border-radius: 6px !important;
          box-shadow: 0 8px 18px rgba(67,38,16,0.24) !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-custom::before {
          border-top-color: rgba(76, 44, 18, 0.35) !important;
        }
        .leaflet-control-zoom {
          border: 1px solid rgba(76, 44, 18, 0.28) !important;
          border-radius: 6px !important;
          overflow: hidden !important;
        }
        .leaflet-control-zoom a {
          color: #4f2f15 !important;
        }
      `}</style>
    </div>
  );
}

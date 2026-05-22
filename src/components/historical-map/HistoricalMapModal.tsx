"use client";

// components/historical-map/HistoricalMapModal.tsx
// Fullscreen modal chứa toàn bộ map experience
// + Timeline (year slider) — kéo qua các năm, marker fade in/out theo year range của landmark

import React, { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { X, Map, Loader2 } from "lucide-react";
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
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: "#f5f1ea" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: "var(--accent-gold)" }}
          />
          <p className="text-sm" style={{ color: "var(--content-muted)" }}>
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

  const { data: allLandmarks = [], isLoading } = useLandmarks({});

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

  // Auto-close landmark panel nếu landmark đó không còn visible (do đổi năm)
  useEffect(() => {
    if (
      selectedLandmark &&
      !visibleLandmarks.find(
        (lm) => lm.landmarkId === selectedLandmark.landmarkId,
      )
    ) {
      setSelectedLandmark(null);
      setSelectedContextId(null);
    }
  }, [visibleLandmarks, selectedLandmark]);

  // ── Callbacks ──────────────────────────────────────────────
  const handleSelectLandmark = useCallback((landmark: Landmark) => {
    setSelectedLandmark(landmark);
    setSelectedContextId(null);
  }, []);

  const handleCloseLandmark = useCallback(() => {
    setSelectedLandmark(null);
    setSelectedContextId(null);
  }, []);

  // ── Render ─────────────────────────────────────────────────
  const panelOpen = !!selectedLandmark;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Top bar */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 h-14 z-10"
        style={{
          background: "var(--palladian)",
          borderBottom: "1px solid var(--oatmeal)",
          boxShadow: "0 1px 4px rgba(27,38,50,0.08)",
        }}
      >
        <Map size={18} style={{ color: "var(--accent-gold)" }} />
        <div>
          <h2
            className="font-bold text-sm leading-tight"
            style={{ color: "var(--content-heading)" }}
          >
            Bản đồ lịch sử Việt Nam
          </h2>
          <p className="text-xs" style={{ color: "var(--content-muted)" }}>
            {isLoading
              ? "Đang tải..."
              : `${visibleLandmarks.length}/${allLandmarks.length} di tích đang hiển thị`}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: "var(--content-muted)" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main content: map + panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map */}
        <div className="flex-1 relative">
          <LeafletMap
            landmarks={visibleLandmarks}
            selectedLandmarkId={selectedLandmark?.landmarkId ?? null}
            onSelectLandmark={handleSelectLandmark}
          />

          {/* Empty state */}
          {!isLoading && visibleLandmarks.length === 0 && (
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-4 rounded-xl text-sm font-medium pointer-events-none text-center"
              style={{
                background: "rgba(255,255,255,0.95)",
                color: "var(--content-heading)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                border: "1px solid var(--card-light-border)",
                backdropFilter: "blur(8px)",
                maxWidth: 320,
              }}
            >
              <div className="text-2xl mb-1">🗺️</div>
              Chưa có di tích nào ở năm{" "}
              <span style={{ color: "var(--accent-gold)" }}>
                {currentYear < 0 ? `${Math.abs(currentYear)} TCN` : currentYear}
              </span>
              <div
                className="text-xs mt-1 font-normal"
                style={{ color: "var(--content-muted)" }}
              >
                Hãy kéo trục thời gian đến mốc khác
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div
          className="shrink-0 overflow-hidden transition-all duration-300"
          style={{
            width: panelOpen ? "360px" : "0px",
            borderLeft: panelOpen
              ? "1px solid var(--card-light-border)"
              : "none",
            boxShadow: panelOpen ? "-4px 0 16px rgba(27,38,50,0.08)" : "none",
          }}
        >
          {selectedLandmark && (
            <div className="w-[360px] h-full overflow-hidden">
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
        onChange={setCurrentYear}
        battleYears={battleYears}
        visibleCount={visibleLandmarks.length}
      />

      {/* Custom Leaflet tooltip style */}
      <style>{`
        .leaflet-tooltip-custom {
          background: white !important;
          border: 1px solid #e5e0d8 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-custom::before {
          border-top-color: #e5e0d8 !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #e5e0d8 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .leaflet-control-zoom a {
          color: #1b2632 !important;
        }
      `}</style>
    </div>
  );
}

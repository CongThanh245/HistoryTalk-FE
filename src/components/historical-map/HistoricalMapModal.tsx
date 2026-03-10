"use client";

// components/historical-map/HistoricalMapModal.tsx
// Fullscreen modal chứa toàn bộ map experience

import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { X, Map, Filter, Loader2 } from "lucide-react";
import type { Landmark, LandmarkType } from "@/services/landmark.service";
import type { EventEraBackend } from "@/services/event.service";
import { LandmarkPanel } from "./LandmarkPanel";
import { EventDetailPanel } from "./EventDetailPanel";
import { LANDMARK_TYPE_CONFIG, ERA_CONFIG_MAP } from "./landmark-config";
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

type FilterEra = EventEraBackend | "ALL";
type FilterType = LandmarkType | "ALL";

export function HistoricalMapModal({
  isOpen,
  onClose,
}: HistoricalMapModalProps) {
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(
    null,
  );
  const [selectedContextId, setSelectedContextId] = useState<string | null>(
    null,
  );
  const [filterEra, setFilterEra] = useState<FilterEra>("ALL");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const { data: landmarks = [], isLoading } = useLandmarks({
    era: filterEra === "ALL" ? undefined : filterEra,
    type: filterType === "ALL" ? undefined : filterType,
  });

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
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSelectLandmark = useCallback((landmark: Landmark) => {
    setSelectedLandmark(landmark);
    setSelectedContextId(null); // reset event detail when switching landmark
  }, []);

  const handleCloseLandmark = useCallback(() => {
    setSelectedLandmark(null);
    setSelectedContextId(null);
  }, []);

  // if (!isOpen) return null;

  const panelOpen = !!selectedLandmark;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Top bar */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 h-14 z-10"
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
            {isLoading ? "Đang tải..." : `${landmarks.length} di tích lịch sử`}
          </p>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={
            showFilters
              ? {
                  background: "var(--accent-gold)",
                  color: "var(--text-inverse)",
                }
              : {
                  background: "var(--card-light-bg)",
                  color: "var(--content-text)",
                  border: "1px solid var(--card-light-border)",
                }
          }
        >
          <Filter size={13} />
          Lọc
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-black/5"
          style={{ color: "var(--content-muted)" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div
          className="flex-shrink-0 flex flex-wrap gap-2 px-4 py-2.5 z-10"
          style={{
            background: "var(--palladian)",
            borderBottom: "1px solid var(--oatmeal)",
          }}
        >
          {/* Era filters */}
          <div className="flex gap-1.5 flex-wrap">
            {(
              [
                "ALL",
                "ANCIENT",
                "MEDIEVAL",
                "MODERN",
                "CONTEMPORARY",
              ] as FilterEra[]
            ).map((era) => (
              <button
                key={era}
                onClick={() => setFilterEra(era)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={
                  filterEra === era
                    ? { background: "var(--abyssal-blue)", color: "#fff" }
                    : {
                        background: "var(--card-light-bg)",
                        color: "var(--content-muted)",
                        border: "1px solid var(--card-light-border)",
                      }
                }
              >
                {era === "ALL" ? "Tất cả thời đại" : ERA_CONFIG_MAP[era]?.label}
              </button>
            ))}
          </div>

          <div
            className="w-px self-stretch"
            style={{ background: "var(--oatmeal)" }}
          />

          {/* Type filters */}
          <div className="flex gap-1.5 flex-wrap">
            {(
              [
                "ALL",
                "battlefield",
                "citadel",
                "river",
                "monument",
              ] as FilterType[]
            ).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={
                  filterType === type
                    ? {
                        background:
                          type === "ALL"
                            ? "var(--abyssal-blue)"
                            : LANDMARK_TYPE_CONFIG[type as LandmarkType]?.color,
                        color: "#fff",
                      }
                    : {
                        background: "var(--card-light-bg)",
                        color: "var(--content-muted)",
                        border: "1px solid var(--card-light-border)",
                      }
                }
              >
                {type === "ALL"
                  ? "Tất cả loại"
                  : `${LANDMARK_TYPE_CONFIG[type as LandmarkType]?.emoji} ${LANDMARK_TYPE_CONFIG[type as LandmarkType]?.label}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content: map + panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map */}
        <div className="flex-1 relative">
          <LeafletMap
            landmarks={landmarks}
            selectedLandmarkId={selectedLandmark?.landmarkId ?? null}
            onSelectLandmark={handleSelectLandmark}
          />

          {/* Hint overlay (only when no landmark selected) */}
          {!selectedLandmark && !isLoading && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-medium pointer-events-none"
              style={{
                background: "rgba(255,255,255,0.92)",
                color: "var(--content-heading)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                border: "1px solid var(--card-light-border)",
                backdropFilter: "blur(8px)",
              }}
            >
              🗺️ Chọn một di tích để xem sự kiện lịch sử
            </div>
          )}
        </div>

        {/* Side panel */}
        <div
          className="flex-shrink-0 overflow-hidden transition-all duration-300"
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

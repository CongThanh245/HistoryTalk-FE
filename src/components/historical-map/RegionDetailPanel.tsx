"use client";

// components/historical-map/RegionDetailPanel.tsx
// Right panel hiện thông tin chi tiết vùng lãnh thổ + landmarks trong vùng

import React from "react";
import { X, Crown, MapPin, Calendar, ChevronRight } from "lucide-react";
import type { RegionProperties } from "@/services/period.service";
import type { Landmark } from "@/services/landmark.service";
import { LANDMARK_TYPE_CONFIG } from "./landmark-config";

interface RegionDetailPanelProps {
  region: RegionProperties;
  periodName: string;
  periodYear: number;
  landmarksInRegion: Landmark[];
  onClose: () => void;
  onSelectLandmark: (landmark: Landmark) => void;
}

export function RegionDetailPanel({
  region,
  periodName,
  periodYear,
  landmarksInRegion,
  onClose,
  onSelectLandmark,
}: RegionDetailPanelProps) {
  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Header */}
      <div
        className="relative shrink-0"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        {region.imageUrl ? (
          <div className="relative h-40 overflow-hidden">
            <img
              src={region.imageUrl}
              alt={region.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
              style={{
                background: `${region.color}dd`,
                color: "#fff",
              }}
            >
              <span
                className="w-2 h-2 rounded-full bg-white"
              />
              Vùng lãnh thổ
            </div>
          </div>
        ) : (
          <div
            className="h-20 flex items-center px-4"
            style={{
              background: `linear-gradient(135deg, ${region.color}22, ${region.color}11)`,
              borderBottom: `3px solid ${region.color}`,
            }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: region.color }}
            >
              Vùng lãnh thổ
            </span>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm transition-colors hover:bg-black/20"
          style={{ background: "rgba(255,255,255,0.85)", color: "#374151" }}
        >
          <X size={16} />
        </button>

        <div className="p-4 pb-3">
          <div
            className="flex items-center gap-1 text-xs mb-1"
            style={{ color: "var(--content-muted)" }}
          >
            <Calendar size={11} />
            <span>
              {periodName} (năm {periodYear})
            </span>
          </div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: "var(--content-heading)" }}
          >
            {region.name}
          </h2>

          {region.ruler && (
            <div
              className="flex items-center gap-1.5 text-xs mb-1"
              style={{ color: "var(--content-text)" }}
            >
              <Crown size={12} style={{ color: region.color }} />
              <span className="font-medium">Cai trị:</span>
              <span>{region.ruler}</span>
            </div>
          )}

          {region.capital && (
            <div
              className="flex items-center gap-1.5 text-xs mb-2"
              style={{ color: "var(--content-text)" }}
            >
              <MapPin size={12} style={{ color: region.color }} />
              <span className="font-medium">Thủ phủ:</span>
              <span>{region.capital}</span>
            </div>
          )}

          {region.description && (
            <p
              className="text-sm leading-relaxed mt-2"
              style={{ color: "var(--content-text)" }}
            >
              {region.description}
            </p>
          )}
        </div>
      </div>

      {/* Landmarks trong vùng */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--card-light-border)" }}
        >
          <MapPin size={14} style={{ color: "var(--accent-gold)" }} />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--content-heading)" }}
          >
            Di tích trong vùng
          </span>
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: "var(--accent-gold-active-bg)",
              color: "var(--accent-gold)",
            }}
          >
            {landmarksInRegion.length}
          </span>
        </div>

        {landmarksInRegion.length === 0 ? (
          <div className="p-6 text-center">
            <p
              className="text-sm italic"
              style={{ color: "var(--content-muted)" }}
            >
              Chưa có di tích nào được ghi nhận trong vùng này ở thời kỳ {periodYear}.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {landmarksInRegion.map((lm) => {
              const typeCfg = LANDMARK_TYPE_CONFIG[lm.type];
              return (
                <button
                  key={lm.landmarkId}
                  onClick={() => onSelectLandmark(lm)}
                  className="w-full text-left p-3 rounded-xl transition-all duration-200 group flex items-start gap-3"
                  style={{
                    background: "var(--card-light-bg)",
                    border: "1px solid var(--card-light-border)",
                  }}
                >
                  <div
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base"
                    style={{
                      background: typeCfg.bgColor,
                      border: `1px solid ${typeCfg.borderColor}`,
                    }}
                  >
                    {typeCfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-snug mb-0.5"
                      style={{ color: "var(--content-heading)" }}
                    >
                      {lm.name}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--content-muted)" }}
                    >
                      {lm.province} · {typeCfg.label}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
                    style={{ color: "var(--content-muted)" }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

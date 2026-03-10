"use client";

// components/historical-map/LandmarkPanel.tsx
// Panel bên phải: hiện thông tin landmark + danh sách sự kiện

import React from "react";
import { X, MapPin, Calendar, ChevronRight, Users, DoorOpen } from "lucide-react";
import type { Landmark } from "@/services/landmark.service";
import { LANDMARK_TYPE_CONFIG, ERA_CONFIG_MAP } from "./landmark-config";
import { useLandmarkEvents } from "@/features/landmark/hooks";
import { useRouter } from "next/navigation";
import { MOCK_ROOMS } from "@/services/room.service";

interface LandmarkPanelProps {
  landmark: Landmark;
  onClose: () => void;
  onSelectEvent: (contextId: string) => void;
  selectedContextId: string | null;
}

export function LandmarkPanel({
  landmark,
  onClose,
  onSelectEvent,
  selectedContextId,
}: LandmarkPanelProps) {
  const { data: events = [], isLoading } = useLandmarkEvents(
    landmark.contextIds,
  );
  const typeConfig = LANDMARK_TYPE_CONFIG[landmark.type];
  const eraConfig = ERA_CONFIG_MAP[landmark.era as keyof typeof ERA_CONFIG_MAP];
  // 2. Trong component, thêm:
  const router = useRouter();
  const room = MOCK_ROOMS.find((r) => r.landmarkId === landmark.landmarkId);
  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--bg-content)" }}
    >
      {/* Header */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ borderBottom: "1px solid var(--card-light-border)" }}
      >
        {/* Thumbnail */}
        {landmark.imageUrl && (
          <div className="relative h-44 overflow-hidden">
            <img
              src={landmark.imageUrl}
              alt={landmark.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {/* Type badge on image */}
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
              style={{
                background: `${typeConfig.bgColor}dd`,
                color: typeConfig.color,
                border: `1px solid ${typeConfig.borderColor}`,
              }}
            >
              <span>{typeConfig.emoji}</span>
              {typeConfig.label}
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-sm transition-colors hover:bg-black/20"
          style={{ background: "rgba(255,255,255,0.8)", color: "#374151" }}
        >
          <X size={16} />
        </button>

        {/* Info */}
        <div className="p-4 pb-3">
          <h2
            className="text-lg font-bold mb-1"
            style={{ color: "var(--content-heading)" }}
          >
            {landmark.name}
          </h2>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: `${eraConfig?.color}15`,
                color: eraConfig?.color,
              }}
            >
              {eraConfig?.label}
            </span>
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--content-muted)" }}
            >
              <MapPin size={11} />
              {landmark.province}
            </span>
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--content-text)" }}
          >
            {landmark.description}
          </p>
          {room && (
            <button
              onClick={() => router.push(`/map/room/${room.roomId}`)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "white",
                boxShadow: "0 4px 14px rgba(201,162,77,0.35)",
              }}
            >
              <DoorOpen size={16} />
              Bước vào không gian lịch sử
            </button>
          )}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--card-light-border)" }}
        >
          <Calendar size={14} style={{ color: "var(--accent-gold)" }} />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--content-heading)" }}
          >
            Sự kiện lịch sử tại đây
          </span>
          <span
            className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              background: "var(--accent-gold-active-bg)",
              color: "var(--accent-gold)",
            }}
          >
            {events.length}
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse space-y-2 p-3 rounded-xl"
                style={{ background: "var(--card-light-bg)" }}
              >
                <div
                  className="h-4 rounded"
                  style={{ background: "var(--bg-surface)", width: "75%" }}
                />
                <div
                  className="h-3 rounded"
                  style={{ background: "var(--bg-surface)", width: "40%" }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {events.map((event) => (
              <button
                key={event.contextId}
                onClick={() => onSelectEvent(event.contextId)}
                className="w-full text-left p-3 rounded-xl transition-all duration-200 group"
                style={
                  selectedContextId === event.contextId
                    ? {
                        background: "var(--accent-gold-active-bg)",
                        border: "1px solid var(--accent-gold-glow)",
                      }
                    : {
                        background: "var(--card-light-bg)",
                        border: "1px solid var(--card-light-border)",
                      }
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold mb-0.5 leading-snug"
                      style={{
                        color:
                          selectedContextId === event.contextId
                            ? "var(--accent-gold)"
                            : "var(--content-heading)",
                      }}
                    >
                      {event.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--content-muted)" }}
                    >
                      Năm{" "}
                      {event.year < 0
                        ? `${Math.abs(event.year)} TCN`
                        : event.year}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="flex-shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5"
                    style={{ color: "var(--content-muted)" }}
                  />
                </div>
                <p
                  className="text-xs mt-1.5 line-clamp-2 leading-relaxed"
                  style={{ color: "var(--content-muted)" }}
                >
                  {event.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

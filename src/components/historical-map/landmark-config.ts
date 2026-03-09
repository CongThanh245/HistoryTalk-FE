// components/historical-map/landmark-config.ts
// Config màu sắc và icon cho từng loại landmark

import type { LandmarkType } from "@/services/landmark.service";

export const LANDMARK_TYPE_CONFIG: Record<
  LandmarkType,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    emoji: string;
  }
> = {
  battlefield: {
    label: "Chiến trường",
    color: "#b8322a",
    bgColor: "#fef2f2",
    borderColor: "#fca5a5",
    emoji: "⚔️",
  },
  citadel: {
    label: "Thành trì",
    color: "#a07828",
    bgColor: "#fffbeb",
    borderColor: "#fcd34d",
    emoji: "🏯",
  },
  river: {
    label: "Sông",
    color: "#1d4ed8",
    bgColor: "#eff6ff",
    borderColor: "#93c5fd",
    emoji: "🌊",
  },
  city: {
    label: "Thành phố",
    color: "#047857",
    bgColor: "#f0fdf4",
    borderColor: "#6ee7b7",
    emoji: "🏙️",
  },
  temple: {
    label: "Đền / Chùa",
    color: "#7c3aed",
    bgColor: "#faf5ff",
    borderColor: "#c4b5fd",
    emoji: "🛕",
  },
  monument: {
    label: "Di tích",
    color: "#c2410c",
    bgColor: "#fff7ed",
    borderColor: "#fdba74",
    emoji: "🗿",
  },
};

export const ERA_CONFIG_MAP = {
  ANCIENT: { label: "Cổ đại", color: "#92400e" },
  MEDIEVAL: { label: "Trung đại", color: "#1e40af" },
  MODERN: { label: "Cận đại", color: "#065f46" },
  CONTEMPORARY: { label: "Hiện đại", color: "#6b21a8" },
  ALL: { label: "Tổng hợp", color: "#374151" },
};

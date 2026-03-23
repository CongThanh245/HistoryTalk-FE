"use client";

// components/historical-map/LeafletMap.tsx
// Leaflet map với custom markers — dynamic import để tránh SSR error

import React, { useEffect, useRef } from "react";
import type { Landmark } from "@/services/landmark.service";
import { LANDMARK_TYPE_CONFIG } from "./landmark-config";

interface LeafletMapProps {
  landmarks: Landmark[];
  selectedLandmarkId: string | null;
  onSelectLandmark: (landmark: Landmark) => void;
}

export function LeafletMap({
  landmarks,
  selectedLandmarkId,
  onSelectLandmark,
}: LeafletMapProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    // Delay nhỏ để đảm bảo container đã mount xong
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      if ((containerRef.current as any)._leaflet_id) return; // ← guard chính

      import("leaflet").then((L) => {
        if (!containerRef.current) return;
        if ((containerRef.current as any)._leaflet_id) return; // ← check lại trong async

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(containerRef.current!, {
          center: [16.5, 107.5],
          zoom: 6,
          zoomControl: true,
          attributionControl: false,
        });

        L.tileLayer(
          "https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}",
          {
            attribution: "&copy; Google Maps",
            maxZoom: 20,
          },
        ).addTo(map);

        const vietnamBounds = L.latLngBounds(
          L.latLng(6.0, 102.0),
          L.latLng(30, 115.0),
        );
        map.setMaxBounds(vietnamBounds.pad(0.5));
        map.setMinZoom(5);

        mapRef.current = map;

        landmarks.forEach((landmark) => {
          addMarker(L, map, landmark, false, onSelectLandmark, markersRef);
        });
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  }, []); // eslint-disable-line

  // Update markers when selection changes
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      landmarks.forEach((landmark) => {
        const marker = markersRef.current[landmark.landmarkId];
        if (marker) {
          // Re-create icon with selected state
          const icon = createCustomIcon(
            L,
            landmark,
            landmark.landmarkId === selectedLandmarkId,
          );
          marker.setIcon(icon);
        }
      });

      // Pan to selected
      if (selectedLandmarkId) {
        const lm = landmarks.find((l) => l.landmarkId === selectedLandmarkId);
        if (lm) {
          mapRef.current.flyTo([lm.lat, lm.lng], 9, { duration: 1 });
        }
      }
    });
  }, [selectedLandmarkId]); // eslint-disable-line

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: "#f5f1ea" }}
      />
    </>
  );
}

function createCustomIcon(L: any, landmark: Landmark, isSelected: boolean) {
  const config = LANDMARK_TYPE_CONFIG[landmark.type];
  const size = isSelected ? 44 : 36;
  const borderColor = isSelected ? config.color : `${config.color}99`;
  const shadow = isSelected
    ? `0 4px 16px ${config.color}60`
    : "0 2px 8px rgba(0,0,0,0.2)";

  const html = `
    <div style="
      width:${size}px;height:${size}px;
      background:${isSelected ? config.color : "#ffffff"};
      border:2.5px solid ${borderColor};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      transition:all 0.2s;
    ">
      <span style="transform:rotate(45deg);font-size:${isSelected ? 18 : 15}px;line-height:1;">
        ${config.emoji}
      </span>
    </div>
    ${
      isSelected
        ? `<div style="
      position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
      background:${config.color};color:#fff;
      font-size:10px;font-weight:600;white-space:nowrap;
      padding:2px 6px;border-radius:4px;
      font-family:system-ui;
    ">${landmark.name}</div>`
        : ""
    }
  `;

  return L.divIcon({
    html: `<div style="position:relative;">${html}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    className: "",
  });
}

function addMarker(
  L: any,
  map: any,
  landmark: Landmark,
  isSelected: boolean,
  onSelect: (lm: Landmark) => void,
  markersRef: React.MutableRefObject<Record<string, any>>,
) {
  const icon = createCustomIcon(L, landmark, isSelected);
  const marker = L.marker([landmark.lat, landmark.lng], { icon });

  marker.on("click", () => onSelect(landmark));

  // Tooltip on hover
  marker.bindTooltip(
    `<div style="font-family:system-ui;font-size:12px;font-weight:600;color:#1b2632;padding:4px 8px;">
      ${LANDMARK_TYPE_CONFIG[landmark.type].emoji} ${landmark.name}
    </div>`,
    { direction: "top", offset: [0, -36], className: "leaflet-tooltip-custom" },
  );

  marker.addTo(map);
  markersRef.current[landmark.landmarkId] = marker;
}

"use client";

// components/historical-map/LeafletMap.tsx
// Leaflet map: chỉ render landmark markers.
// Component cha (HistoricalMapModal) đã filter landmarks theo currentYear,
// LeafletMap không cần biết về year — chỉ render những gì được pass vào.

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
  const [mapReady, setMapReady] = React.useState(false);

  // Stable ref for callback (avoid re-binding on every render)
  const onSelectLandmarkRef = useRef(onSelectLandmark);
  useEffect(() => {
    onSelectLandmarkRef.current = onSelectLandmark;
  });

  // ── Init map ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      if ((containerRef.current as any)._leaflet_id) return;

      import("leaflet").then((L) => {
        if (!containerRef.current) return;
        if ((containerRef.current as any)._leaflet_id) return;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const vietnamBounds = L.latLngBounds(
          L.latLng(8.0, 102.0),
          L.latLng(23.5, 110.0),
        );

        const map = L.map(containerRef.current!, {
          center: [16.5, 106.0],
          zoom: 6,
          minZoom: 5,
          maxZoom: 18,
          maxBounds: vietnamBounds.pad(0.15),
          maxBoundsViscosity: 1.0,
          zoomControl: true,
          attributionControl: false,
        });

        map.fitBounds(vietnamBounds);

        L.tileLayer(
          "https://mt1.google.com/vt/lyrs=m&hl=vi&x={x}&y={y}&z={z}",
          {
            attribution: "&copy; Google Maps",
            maxZoom: 18,
          },
        ).addTo(map);

        mapRef.current = map;
        setMapReady(true);
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
  }, []);

  // ── Sync markers with `landmarks` prop ────────────────────
  // Runs whenever landmarks change OR after map finishes initializing.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      const currentIds = new Set(landmarks.map((l) => l.landmarkId));

      // Fade out + remove markers no longer in list
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          const marker = markersRef.current[id];
          fadeOutAndRemove(marker, map);
          delete markersRef.current[id];
        }
      });

      // Add new markers / update existing
      landmarks.forEach((landmark) => {
        const isSelected = landmark.landmarkId === selectedLandmarkId;
        const icon = createCustomIcon(L, landmark, isSelected);

        if (markersRef.current[landmark.landmarkId]) {
          markersRef.current[landmark.landmarkId].setIcon(icon);
        } else {
          addMarker(L, map, landmark, isSelected, markersRef, onSelectLandmarkRef);
        }
      });
    });
  }, [landmarks, selectedLandmarkId, mapReady]);

  // ── Fly to selected landmark ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedLandmarkId) return;
    const lm = landmarks.find((l) => l.landmarkId === selectedLandmarkId);
    if (lm) {
      mapRef.current.flyTo([lm.lat, lm.lng], 9, { duration: 1 });
    }
  }, [selectedLandmarkId, landmarks]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: "#f5f1ea" }}
      />
      <style>{`
        /* Fade-in animation for new markers */
        .leaflet-marker-icon.landmark-marker {
          animation: markerFadeIn 350ms ease-out;
        }
        @keyframes markerFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────

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
    className: "landmark-marker",
  });
}

function addMarker(
  L: any,
  map: any,
  landmark: Landmark,
  isSelected: boolean,
  markersRef: React.MutableRefObject<Record<string, any>>,
  onSelectRef: React.MutableRefObject<(landmark: Landmark) => void>,
) {
  const icon = createCustomIcon(L, landmark, isSelected);
  const marker = L.marker([landmark.lat, landmark.lng], {
    icon,
    zIndexOffset: 1000,
  });

  marker.on("click", () => {
    onSelectRef.current(landmark);
  });

  marker.bindTooltip(
    `<div style="font-family:system-ui;font-size:12px;font-weight:600;color:#1b2632;padding:4px 8px;">
      ${LANDMARK_TYPE_CONFIG[landmark.type].emoji} ${landmark.name}
    </div>`,
    { direction: "top", offset: [0, -36], className: "leaflet-tooltip-custom" },
  );

  marker.addTo(map);
  markersRef.current[landmark.landmarkId] = marker;
}

function fadeOutAndRemove(marker: any, map: any) {
  const el: HTMLElement | undefined = marker.getElement?.();
  if (el) {
    el.style.transition = "opacity 250ms ease, transform 250ms ease";
    el.style.opacity = "0";
    el.style.transform = `${el.style.transform} translateY(-8px)`;
    setTimeout(() => {
      try {
        map.removeLayer(marker);
      } catch {}
    }, 260);
  } else {
    try {
      map.removeLayer(marker);
    } catch {}
  }
}

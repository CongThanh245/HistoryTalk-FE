"use client";

// components/historical-map/LeafletMap.tsx
// Leaflet map: territory GeoJSON layer + landmark markers
// - Hover region → call onRegionHover với screen coords
// - Click region → call onRegionClick
// - Click landmark → call onSelectLandmark

import React, { useEffect, useRef } from "react";
import type { Landmark } from "@/services/landmark.service";
import type {
  HistoricalPeriod,
  RegionProperties,
} from "@/services/period.service";
import { LANDMARK_TYPE_CONFIG } from "./landmark-config";

interface LeafletMapProps {
  landmarks: Landmark[];
  selectedLandmarkId: string | null;
  onSelectLandmark: (landmark: Landmark) => void;
  period: HistoricalPeriod | null;
  selectedRegionId: string | null;
  onRegionHover: (
    region: RegionProperties | null,
    screenX: number,
    screenY: number,
  ) => void;
  onRegionClick: (region: RegionProperties) => void;
}

export function LeafletMap({
  landmarks,
  selectedLandmarkId,
  onSelectLandmark,
  period,
  selectedRegionId,
  onRegionHover,
  onRegionClick,
}: LeafletMapProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const geoJsonLayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable refs for callbacks (avoid re-binding handlers on every render)
  const onRegionHoverRef = useRef(onRegionHover);
  const onRegionClickRef = useRef(onRegionClick);
  const onSelectLandmarkRef = useRef(onSelectLandmark);
  useEffect(() => {
    onRegionHoverRef.current = onRegionHover;
    onRegionClickRef.current = onRegionClick;
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
          L.latLng(6.0, 100.0),
          L.latLng(24, 115.0),
        );
        map.setMaxBounds(vietnamBounds.pad(0.5));
        map.setMinZoom(5);

        mapRef.current = map;
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
        geoJsonLayerRef.current = null;
      }
    };
  }, []);

  // ── Update territory layer when period changes ────────────
  useEffect(() => {
    if (!mapRef.current || !period) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Remove old layer
      if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
        geoJsonLayerRef.current = null;
      }

      // Add new layer
      const layer = L.geoJSON(period.geojson as any, {
        style: (feature: any) => {
          const props = feature.properties as RegionProperties;
          const isSelected = props.regionId === selectedRegionId;
          return {
            color: props.color,
            weight: isSelected ? 3 : 1.5,
            opacity: 0.9,
            fillColor: props.color,
            fillOpacity: isSelected ? 0.55 : 0.35,
            className: "territory-region",
          };
        },
        onEachFeature: (feature: any, lyr: any) => {
          const props = feature.properties as RegionProperties;

          lyr.on("mouseover", (e: any) => {
            lyr.setStyle({ fillOpacity: 0.6, weight: 2.5 });
            lyr.bringToFront();
            const point = map.latLngToContainerPoint(e.latlng);
            onRegionHoverRef.current(props, point.x, point.y);
          });

          lyr.on("mousemove", (e: any) => {
            const point = map.latLngToContainerPoint(e.latlng);
            onRegionHoverRef.current(props, point.x, point.y);
          });

          lyr.on("mouseout", () => {
            const isSelected = props.regionId === selectedRegionId;
            lyr.setStyle({
              fillOpacity: isSelected ? 0.55 : 0.35,
              weight: isSelected ? 3 : 1.5,
            });
            onRegionHoverRef.current(null, 0, 0);
          });

          lyr.on("click", () => {
            onRegionClickRef.current(props);
          });
        },
      });

      layer.addTo(map);
      geoJsonLayerRef.current = layer;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period?.periodId]);

  // ── Re-style when selectedRegionId changes ────────────────
  useEffect(() => {
    if (!geoJsonLayerRef.current) return;
    geoJsonLayerRef.current.eachLayer((lyr: any) => {
      const props = lyr.feature?.properties as RegionProperties;
      if (!props) return;
      const isSelected = props.regionId === selectedRegionId;
      lyr.setStyle({
        weight: isSelected ? 3 : 1.5,
        fillOpacity: isSelected ? 0.55 : 0.35,
      });
    });
  }, [selectedRegionId]);

  // ── Update landmark markers ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      // Remove markers not in current landmarks list
      const currentIds = new Set(landmarks.map((l) => l.landmarkId));
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });

      // Add / update markers
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
  }, [landmarks, selectedLandmarkId]);

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
        .territory-region {
          transition: fill-opacity 200ms ease, stroke-width 200ms ease;
          cursor: pointer;
        }
      `}</style>
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
  markersRef: React.MutableRefObject<Record<string, any>>,
  onSelectRef: React.MutableRefObject<(landmark: Landmark) => void>,
) {
  const icon = createCustomIcon(L, landmark, isSelected);
  const marker = L.marker([landmark.lat, landmark.lng], { icon, zIndexOffset: 1000 });

  marker.on("click", (e: any) => {
    // Prevent click bubbling to region polygon
    (L as any).DomEvent.stopPropagation(e);
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

"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMapInstance } from "leaflet";
import { Crosshair } from "lucide-react";
import { MAP_BOUNDS } from "@/components/historical-map/map-overlay.types";

export interface MapView {
  latitude: number;
  longitude: number;
  zoom: number;
}

export const VIETNAM_VIEW: MapView = { latitude: 15.65, longitude: 108.45, zoom: 6.25 };

const round = (value: number) => Math.round(value * 100000) / 100000;

/**
 * Pick a map camera point by framing it: staff pan/zoom until the map shows what learners should see,
 * and the centre + zoom become the point. Limits mirror the learner map (LeafletMap) so a saved view
 * is always reachable there.
 */
export function MapFocusPicker({ initial, onChange }: { initial: MapView; onChange: (view: MapView) => void }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<LeafletMapInstance | null>(null);
  // The map is created once; later prop changes must not rebuild it, so read them through refs.
  const initialRef = React.useRef(initial);
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  React.useEffect(() => {
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const start = initialRef.current;
      const map = L.map(containerRef.current, {
        center: [start.latitude, start.longitude],
        zoom: start.zoom,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        minZoom: 5.5,
        maxZoom: 11,
        maxBounds: [
          [MAP_BOUNDS.south, MAP_BOUNDS.west],
          [MAP_BOUNDS.north, MAP_BOUNDS.east],
        ],
        maxBoundsViscosity: 1.0,
      });
      map.zoomControl.setPosition("bottomright");
      map.attributionControl.setPrefix(false);
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 16, attribution: "&copy; Esri, &copy; OpenStreetMap" },
      ).addTo(map);

      const report = () => {
        const center = map.getCenter();
        onChangeRef.current({ latitude: round(center.lat), longitude: round(center.lng), zoom: map.getZoom() });
      };
      map.on("moveend", report);
      // A click is the quick way to say "here": glide the crosshair onto it.
      map.on("click", (event) => map.panTo(event.latlng));
      mapRef.current = map;
      // Report the starting view too, so a brand-new point is valid without touching the map.
      report();
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    // `isolate` keeps Leaflet's high pane z-indexes inside this box, below the page's sticky header.
    <div className="relative isolate h-72 overflow-hidden rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-deep)]">
      <div ref={containerRef} className="absolute inset-0" />
      <Crosshair
        className="pointer-events-none absolute top-1/2 left-1/2 z-[450] h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-[var(--accent-gold)] drop-shadow"
        strokeWidth={2.25}
        aria-hidden="true"
      />
    </div>
  );
}

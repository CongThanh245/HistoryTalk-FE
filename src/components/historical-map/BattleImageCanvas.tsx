"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import type { Map as LeafletMap, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./battle-experience.module.css";

export function BattleImageCanvas({ src, title }: { src: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const boundsRef = useRef<LatLngBounds | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [zoom, setZoom] = useState(1);
  const baseZoom = useRef(0);

  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    const image = new window.Image();
    image.onload = async () => {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        attributionControl: false,
        zoomControl: false,
        zoomSnap: 0,
        zoomDelta: .5,
        minZoom: -10,
        maxZoom: 5,
        scrollWheelZoom: true,
        maxBoundsViscosity: 1,
        zoomAnimation: !reducedMotion,
        fadeAnimation: !reducedMotion,
      });
      const bounds = L.latLngBounds([0, 0], [image.naturalHeight, image.naturalWidth]);
      L.imageOverlay(src, bounds, { alt: title, interactive: false }).addTo(map);
      boundsRef.current = bounds;
      mapRef.current = map;
      const fit = () => {
        map.stop();
        map.invalidateSize({ pan: false });
        map.setMinZoom(-10);
        const fittedZoom = map.getBoundsZoom(bounds, false, L.point(24, 24));
        baseZoom.current = fittedZoom;
        map.setMinZoom(fittedZoom);
        map.setMaxZoom(fittedZoom + 3);
        map.fitBounds(bounds, { padding: [12, 12], animate: false });
        setZoom(1);
      };
      fit();
      map.setMaxBounds(bounds.pad(.1));
      map.on("zoomend", () => setZoom(Math.pow(2, map.getZoom() - baseZoom.current)));
      observer = new ResizeObserver(fit);
      observer.observe(containerRef.current);
      setStatus("ready");
    };
    image.onerror = () => { if (!disposed) setStatus("error"); };
    image.src = src;
    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [src, title]);

  return (
    <div className={styles.imageStage}>
      <div ref={containerRef} className={styles.imageCanvas} aria-label={title} />
      {status === "loading" && <div className={styles.imageStatus} role="status"><Loader2 size={24} className="animate-spin" /><span>Đang mở tư liệu...</span></div>}
      {status === "error" && <div className={styles.imageStatus} role="alert">Không tải được ảnh tư liệu.</div>}
      <div className={styles.imageTools} role="toolbar" aria-label="Điều chỉnh ảnh">
        <button type="button" title="Thu nhỏ" aria-label="Thu nhỏ" disabled={status !== "ready" || zoom <= 1.01} onClick={() => mapRef.current?.zoomOut(.5)}><Minus size={18} /></button>
        <output aria-label="Mức phóng to">{Math.round(zoom * 100)}%</output>
        <button type="button" title="Phóng to" aria-label="Phóng to" disabled={status !== "ready" || zoom >= 7.99} onClick={() => mapRef.current?.zoomIn(.5)}><Plus size={18} /></button>
        <span className={styles.toolDivider} />
        <button type="button" title="Xem toàn bộ ảnh" aria-label="Xem toàn bộ ảnh" disabled={status !== "ready"} onClick={() => { if (boundsRef.current) mapRef.current?.fitBounds(boundsRef.current, { padding: [12, 12], animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches }); }}><RotateCcw size={17} /></button>
      </div>
    </div>
  );
}

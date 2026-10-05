"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HistoricalMapModal, type MapRoute, type MapRouteNavigation } from "./HistoricalMapModal";
import type { MapOverlay } from "./map-overlay.types";

/**
 * Full-page battle map whose screen lives in the URL, so reload, shared links and
 * browser Back/Forward land on the same place:
 * `?battle=<contextId>` (selected) · `&view=detail` (battle page) · `&view=edit` (lược đồ editor).
 */
export function UrlSyncedHistoricalMap({ onClose, overlay }: { onClose: () => void; overlay?: MapOverlay }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  /** Entries this page pushed; "back" pops them, otherwise (e.g. opened from a link) it replaces. */
  const pushed = useRef(0);

  useEffect(() => {
    const onPop = () => { pushed.current = Math.max(0, pushed.current - 1); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const view = params.get("view");
  const route: MapRoute = {
    battle: params.get("battle"),
    view: view === "detail" || view === "edit" ? view : "map",
  };

  const onRouteChange = (next: MapRoute, how: MapRouteNavigation) => {
    if (how === "back" && pushed.current > 0) {
      pushed.current -= 1;
      router.back();
      return;
    }
    const query = new URLSearchParams(params.toString());
    if (next.battle) query.set("battle", next.battle); else query.delete("battle");
    if (next.view !== "map") query.set("view", next.view); else query.delete("view");
    const url = query.size ? `${pathname}?${query}` : pathname;
    if (how === "push") {
      pushed.current += 1;
      router.push(url, { scroll: false });
    } else {
      router.replace(url, { scroll: false });
    }
  };

  return <HistoricalMapModal isOpen onClose={onClose} route={route} onRouteChange={onRouteChange} overlay={overlay} />;
}

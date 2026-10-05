"use client";

import Link from "next/link";
import { CalendarDays, Map as MapIcon, MapPin } from "lucide-react";
import { mapEraLabel } from "@/constants/eras";
import type { LocalContext } from "@/features/saas/types";

/** Read-only article view of a local history context (rows 14, 17 — EVENT with a LOCAL target). */
export function StudentContextArticle({ context, mapHref }: { context: LocalContext; mapHref?: string }) {
  const hasCoords = typeof context.latitude === "number" && typeof context.longitude === "number";
  const paragraphs = context.body.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="space-y-5 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 sm:p-6">
      <header className="space-y-3 border-b border-[var(--border-default)] pb-4">
        <h2 className="archive-title is-plain text-2xl sm:text-3xl">{context.title}</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-content-muted">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--jade)]" aria-hidden="true" />
            {mapEraLabel(context.era)} · {context.year}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[var(--jade)]" aria-hidden="true" />
            {context.location}
          </span>
        </div>
      </header>

      {context.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- teacher-provided URL of any host
        <img src={context.imageUrl} alt="" className="max-h-80 w-full rounded-[2px] border border-[var(--border-default)] object-cover" />
      )}

      <p className="border-y border-[var(--border-default)] bg-[color-mix(in_srgb,var(--jade)_7%,transparent)] px-4 py-3 text-[15px] font-semibold leading-relaxed text-content-text">
        {context.summary}
      </p>

      <div className="space-y-3 text-[15px] leading-relaxed text-content-text">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {hasCoords && mapHref && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] pt-4">
          <span className="text-[13px] text-content-muted">
            Tọa độ {context.latitude!.toFixed(4)}, {context.longitude!.toFixed(4)}
          </span>
          <Link href={mapHref} className="btn-line">
            <MapIcon className="h-4 w-4" aria-hidden="true" /> Xem trên bản đồ
          </Link>
        </div>
      )}
    </article>
  );
}

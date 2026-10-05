"use client";

import * as React from "react";
import { formatNumber } from "@/components/saas/saas-ui";

/**
 * Messages-per-day column chart (single series, so no legend: the heading names it).
 * Inline SVG, per-bar <title> tooltip, sr-only table for screen readers.
 */
export function DailyBarChart({
  data,
  unit = "tin nhắn",
  caption,
}: {
  data: { date: string; messages: number }[];
  unit?: string;
  caption: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.messages));
  const niceMax = Math.ceil(max / 10) * 10 || 10;
  const total = data.reduce((s, d) => s + d.messages, 0);
  const peak = data.reduce((best, d) => (d.messages > best.messages ? d : best), data[0] ?? { date: "", messages: 0 });

  const W = 560;
  const H = 200;
  const padL = 32;
  const padR = 8;
  const padT = 18;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(6, Math.min(26, slot - 6));
  const y = (v: number) => padT + innerH - (v / niceMax) * innerH;
  const label = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const ticks = [0, niceMax / 2, niceMax];

  const summary = `${caption}: tổng ${formatNumber(total)} ${unit} trong ${data.length} ngày, trung bình ${formatNumber(
    Math.round(total / Math.max(1, data.length)),
  )} mỗi ngày, cao nhất ${formatNumber(peak.messages)} vào ngày ${peak.date ? label(peak.date) : "—"}.`;

  return (
    <figure className="space-y-2">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={summary}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="stroke-[var(--border-default)]" strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-tertiary)] text-[10px]">
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = padL + slot * i + slot / 2;
            const h = Math.max(d.messages > 0 ? 2 : 0, padT + innerH - y(d.messages));
            const isActive = active === i;
            return (
              <g
                key={d.date}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                className="outline-none"
              >
                <title>{`${label(d.date)}: ${formatNumber(d.messages)} ${unit}`}</title>
                {/* Hit target bigger than the mark. */}
                <rect x={cx - slot / 2} y={padT} width={slot} height={innerH} className="fill-transparent" />
                <rect
                  x={cx - barW / 2}
                  y={padT + innerH - h}
                  width={barW}
                  height={h}
                  rx={2}
                  className={isActive ? "fill-[var(--accent-bronze)]" : "fill-[var(--accent-gold)]"}
                />
                {(isActive || i === data.length - 1 || d === peak) && d.messages > 0 && (
                  <text x={cx} y={padT + innerH - h - 5} textAnchor="middle" className="fill-[var(--text-primary)] text-[10px] font-bold">
                    {d.messages}
                  </text>
                )}
                {(i % 2 === data.length % 2 || i === data.length - 1) && (
                  <text x={cx} y={H - 10} textAnchor="middle" className="fill-[var(--text-tertiary)] text-[10px]">
                    {label(d.date)}
                  </text>
                )}
              </g>
            );
          })}
          <line x1={padL} x2={W - padR} y1={padT + innerH} y2={padT + innerH} className="stroke-[var(--text-primary)]" strokeWidth={1} />
        </svg>
      </div>
      <figcaption className="text-xs text-content-muted">{summary}</figcaption>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Số {unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{label(d.date)}</td>
              <td>{d.messages}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal bar for a ranking row; width via SVG rect so no inline style is needed. */
export function InlineBar({ value, max, className = "fill-[var(--gold-leaf)]" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 2 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <svg className="block h-2 w-full" aria-hidden="true">
      <rect width="100%" height="100%" className="fill-[var(--status-neutral-bg)]" />
      <rect width={`${pct}%`} height="100%" rx={1} className={className} />
    </svg>
  );
}

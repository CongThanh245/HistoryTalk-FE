"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Small dependency-free charts for the School Admin dashboard. Geometry is HTML/CSS (plus one SVG path
 * for the line), so labels stay crisp at 375px. Each chart carries a text summary and a screen-reader
 * table; hover/focus shows the exact value.
 */

export interface ChartDatum {
  key: string;
  label: string;
  value: number;
}

const fmt = (n: number) => n.toLocaleString("vi-VN");

/** Round the axis max up to 1/2/5 × 10ⁿ so the gridline labels are clean numbers. */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

function SrTable({ caption, unit, data, format }: { caption: string; unit: string; data: ChartDatum[]; format: (n: number) => string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Mốc</th>
          <th scope="col">{unit}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d.key}>
            <th scope="row">{d.label}</th>
            <td>{format(d.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Column (bar) or line chart over a category / time axis. One series, one y-axis.
 * `directLabels`: "all" labels every column (use for ≤ 6 columns), "extremes" only the max and the last.
 */
export function SchoolTrendChart({
  data,
  variant = "bar",
  color = "var(--men-lam)",
  title,
  unit,
  summary,
  directLabels = "extremes",
  format = fmt,
  className,
}: {
  data: ChartDatum[];
  variant?: "bar" | "line";
  color?: string;
  title: string;
  unit: string;
  summary: string;
  directLabels?: "all" | "extremes" | "none";
  format?: (n: number) => string;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const pct = (v: number) => (v / max) * 100;
  const n = data.length;
  const x = (i: number) => ((i + 0.5) / n) * 100;
  const showLabel = (i: number) =>
    directLabels === "all" || (directLabels === "extremes" && (i === peak || i === n - 1));

  return (
    <figure className={cn("space-y-2", className)}>
      <figcaption className="text-xs text-content-muted">{summary}</figcaption>
      <div className="grid grid-cols-[auto_1fr] gap-x-2" aria-hidden="true">
        {/* y-axis */}
        <div className="relative h-44 w-9 text-right text-[10px] tabular-nums text-[var(--text-tertiary)]">
          {[1, 0.5, 0].map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t) * 100}%` }}>
              {format(Math.round(max * t))}
            </span>
          ))}
        </div>

        {/* plot */}
        <div className="relative h-44 border-b border-[var(--text-primary)]" onMouseLeave={() => setHover(null)}>
          {[0, 0.5].map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-dashed border-[var(--border-default)]" style={{ top: `${t * 100}%` }} />
          ))}

          {variant === "line" && n > 1 && (
            <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={data.map((d, i) => `${x(i)},${100 - pct(d.value)}`).join(" ")}
              />
            </svg>
          )}

          <div className="absolute inset-0 flex gap-[2px]">
            {data.map((d, i) => {
              const h = pct(d.value);
              const active = hover === i;
              return (
                <div
                  key={d.key}
                  className="relative flex h-full min-w-0 flex-1 items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                >
                  {variant === "bar" ? (
                    <div
                      className="w-full max-w-[44px] rounded-t-[2px] transition-opacity"
                      style={{ height: `${h}%`, background: color, opacity: hover == null || active ? 1 : 0.55 }}
                    />
                  ) : (
                    <>
                      {active && <div className="absolute inset-y-0 left-1/2 border-l border-[var(--border-strong)]" />}
                      <span
                        className="absolute left-1/2 size-2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-[var(--bg-surface)]"
                        style={{ bottom: `${h}%`, background: color, width: active ? 10 : 8, height: active ? 10 : 8 }}
                      />
                    </>
                  )}
                  {showLabel(i) && !active && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pb-1 text-[10px] font-bold tabular-nums text-content-heading"
                      style={{ bottom: `${h}%` }}
                    >
                      {format(d.value)}
                    </span>
                  )}
                  {active && (
                    <span
                      className="pointer-events-none absolute z-10 mb-2 whitespace-nowrap rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] text-content-heading"
                      style={{
                        bottom: `${Math.min(h, 80)}%`,
                        ...(i < n / 3 ? { left: 0 } : i > (2 * n) / 3 ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }),
                      }}
                    >
                      <span className="font-semibold">{d.label}</span> · <span className="tabular-nums">{format(d.value)}</span> {unit}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* x-axis */}
        <div />
        <div className="flex gap-[2px] pt-1">
          {data.map((d, i) => (
            <span key={d.key} className="min-w-0 flex-1 truncate text-center text-[10px] tabular-nums text-[var(--text-tertiary)]">
              {(n - 1 - i) % labelEvery === 0 ? d.label : ""}
            </span>
          ))}
        </div>
      </div>
      <SrTable caption={title} unit={unit} data={data} format={format} />
    </figure>
  );
}

/** Ranked horizontal bars (top N), value labelled at the end of each bar. */
export function SchoolRankBars({
  data,
  color = "var(--gold-leaf)",
  title,
  unit,
  summary,
  format = fmt,
}: {
  data: (ChartDatum & { hint?: string })[];
  color?: string;
  title: string;
  unit: string;
  summary: string;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className="space-y-3">
      <figcaption className="text-xs text-content-muted">{summary}</figcaption>
      <ol className="space-y-2.5" aria-hidden="true">
        {data.map((d) => (
          <li key={d.key} className="grid grid-cols-[4.5rem_1fr] items-center gap-3 text-sm" title={`${d.label}: ${format(d.value)} ${unit}`}>
            <span className="truncate font-semibold text-content-heading">{d.label}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-3 rounded-r-[2px]" style={{ width: `${Math.max(2, (d.value / max) * 82)}%`, background: color }} />
              <span className="shrink-0 text-xs tabular-nums text-content-text">
                {format(d.value)}
                {d.hint && <span className="text-content-muted"> · {d.hint}</span>}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <SrTable caption={title} unit={unit} data={data} format={format} />
    </figure>
  );
}

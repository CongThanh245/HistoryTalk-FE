"use client";

import * as React from "react";
import { formatNumber } from "@/components/saas/saas-ui";
import { cn } from "@/lib/utils/cn";

/**
 * Single-series daily bar chart in plain HTML/CSS (labels keep their real size at 375px).
 * One hue, recessive baseline, value labels only on the peak and today (plus the hovered bar),
 * hover / focus tooltip per bar, and a screen-reader table with every value.
 */
export function StudentActivityBars({
  data,
  color = "var(--accent-gold)",
  unit = "tin nhắn",
}: {
  data: { date: string; messages: number }[];
  color?: string;
  unit?: string;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.messages));
  const peak = data.reduce((best, d, i) => (d.messages > data[best].messages ? i : best), 0);
  const label = (date: string) => `${Number(date.slice(8, 10))}/${Number(date.slice(5, 7))}`;

  return (
    <figure className="space-y-1">
      <div className="flex h-36 items-end gap-[2px] border-b border-[var(--border-strong)] sm:gap-1.5" aria-hidden="true">
        {data.map((d, i) => {
          const pct = d.messages > 0 ? Math.max(3, (d.messages / max) * 85) : 0;
          const isLast = i === data.length - 1;
          const showValue = d.messages > 0 && (i === peak || isLast || active === i);
          return (
            <div
              key={d.date}
              className="relative flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {active === i && (
                <span
                  className={cn(
                    "pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap",
                    i < 2 ? "left-0" : i > data.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2",
                  )}
                >
                  <span className="block rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] px-2 py-1 text-[12px] text-content-text">
                    <span className="font-bold">{label(d.date)}</span> · {formatNumber(d.messages)} {unit}
                  </span>
                </span>
              )}
              {showValue && <span className="mb-0.5 text-[11px] font-bold tabular-nums text-content-text">{d.messages}</span>}
              <span
                className={cn(
                  "block w-full max-w-[26px] rounded-t-[2px] motion-safe:transition-opacity",
                  active !== null && active !== i && "opacity-45",
                )}
                style={{ height: `${pct}%`, background: color }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-[2px] sm:gap-1.5" aria-hidden="true">
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          const show = isLast || (data.length - 1 - i) % 3 === 0;
          return (
            <span
              key={d.date}
              className={cn(
                "min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[11px] tabular-nums",
                isLast ? "font-bold text-content-text" : "text-content-muted",
              )}
            >
              {isLast ? "Nay" : show ? label(d.date) : ""}
            </span>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Số {unit} theo ngày, {data.length} ngày gần nhất</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{label(d.date)}</th>
              <td>
                {d.messages} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

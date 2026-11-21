"use client";

import * as React from "react";

// Biểu đồ vùng/đường dùng chung cho dashboard System Admin và School Admin.

export interface ChartSeries {
  label: string;
  data: number[];
  color: string;
  gradientId: string;
  valueFormatter: (v: number) => string;
  maxVal?: number;
}

interface SaaSLineChartProps {
  dates: string[];
  series: ChartSeries[];
}

export function SaaSLineChart({ dates, series }: SaaSLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const N = dates.length;
  if (N === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-xs text-[var(--content-muted)]">
        Không có dữ liệu trong khoảng thời gian này
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = 150;
  const topPadding = 15;
  const bottomPadding = 10;
  const chartHeight = svgHeight - topPadding - bottomPadding;

  // Calculate coordinates for each series
  const seriesPaths = series.map((s) => {
    const sMax = s.maxVal ?? Math.max(...s.data, 1);
    
    // Map data to {x, y} coordinates in SVG space
    const points = s.data.map((val, idx) => {
      const x = N > 1 ? (idx / (N - 1)) * svgWidth : svgWidth / 2;
      const y = svgHeight - bottomPadding - (val / sMax) * chartHeight;
      return { x, y };
    });

    // Build Line Path: "M x0 y0 L x1 y1 ..."
    const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

    // Build Area Path: start at bottom-left, draw line, close at bottom-right
    let areaPath = "";
    if (points.length > 0) {
      const firstX = points[0].x;
      const lastX = points[points.length - 1].x;
      const bottomY = svgHeight - bottomPadding;
      areaPath = `M ${firstX.toFixed(1)} ${bottomY.toFixed(1)} ` + points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + ` L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
    }

    return {
      label: s.label,
      color: s.color,
      gradientId: s.gradientId,
      points,
      linePath,
      areaPath,
      valueFormatter: s.valueFormatter,
      data: s.data,
    };
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const idx = Math.min(Math.max(Math.round(pct * (N - 1)), 0), N - 1);
    setHoveredIdx(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };
  
  // Format dates to short DD/MM form for X-axis labels
  const formatShortDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length >= 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Generate X-axis tick indices (show up to 5-6 dates to avoid overlaps)
  const tickStep = Math.max(Math.floor(N / 5), 1);
  const tickIndices: number[] = [];
  for (let i = 0; i < N; i += tickStep) {
    tickIndices.push(i);
  }
  if (tickIndices[tickIndices.length - 1] !== N - 1 && N - 1 >= 0) {
    tickIndices.push(N - 1);
  }

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 select-none">
        {series.map((s, idx) => (
          <span key={idx} className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--content-muted)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* SVG Plot */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width="100%"
          height="160"
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="overflow-visible cursor-crosshair select-none"
        >
          {/* Gradients */}
          <defs>
            {series.map((s, idx) => (
              <linearGradient key={idx} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Dotted Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = topPadding + ratio * chartHeight;
            return (
              <line
                key={ratio}
                x1="0"
                y1={y}
                x2={svgWidth}
                y2={y}
                stroke="var(--card-light-border)"
                strokeDasharray="4 4"
                strokeWidth="0.8"
                opacity="0.2"
              />
            );
          })}

          {/* Shaded Areas and Stroke Lines */}
          {seriesPaths.map((sp, idx) => (
            <g key={idx}>
              {sp.areaPath && (
                <path
                  d={sp.areaPath}
                  fill={`url(#${sp.gradientId})`}
                  className="transition-all duration-300"
                />
              )}
              {sp.linePath && (
                <path
                  d={sp.linePath}
                  fill="none"
                  stroke={sp.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}
              {sp.points.length === 1 && (
                <circle
                  cx={sp.points[0].x}
                  cy={sp.points[0].y}
                  r="4.5"
                  fill={sp.color}
                  className=""
                />
              )}
            </g>
          ))}

          {/* Interactive Guide line and glows */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={N > 1 ? (hoveredIdx / (N - 1)) * svgWidth : svgWidth / 2}
                y1={topPadding}
                x2={N > 1 ? (hoveredIdx / (N - 1)) * svgWidth : svgWidth / 2}
                y2={svgHeight - bottomPadding}
                stroke="var(--accent-gold)"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                opacity="0.7"
              />
              {seriesPaths.map((sp, idx) => {
                const pt = sp.points[hoveredIdx];
                if (!pt) return null;
                return (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6.5"
                      fill={sp.color}
                      opacity="0.3"
                      className="animate-ping"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={sp.color}
                      stroke="var(--bg-surface)"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* X-Axis Labels: HTML overlay to prevent overlaps and fit perfectly inside card bounds */}
        <div className="relative w-full h-5 mt-2 border-t border-[var(--border-default)] pt-1.5 select-none">
          {tickIndices.map((idx) => {
            const dateStr = dates[idx];
            const pct = N > 1 ? (idx / (N - 1)) * 100 : 50;
            return (
              <span
                key={idx}
                className="absolute text-[9px] font-bold text-[var(--content-muted)]"
                style={{
                  left: `${pct}%`,
                  transform: `translateX(-${pct}%)`,
                  whiteSpace: "nowrap",
                }}
              >
                {formatShortDate(dateStr)}
              </span>
            );
          })}
        </div>

        {/* Premium Floating SaaS Tooltip (Adjusts position to avoid card clipping) */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 z-30 transition-all duration-150 pointer-events-none"
            style={{
              left: `${(N > 1 ? hoveredIdx / (N - 1) : 0.5) * 100}%`,
              transform: `translate(${(N > 1 ? hoveredIdx / (N - 1) : 0.5) > 0.7 ? "-105%" : "12px"}, -50%)`,
            }}
          >
            <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] border border-[var(--card-light-border)] rounded-sm py-2 px-3.5 text-[10px] min-w-[155px]">
              <div className="font-bold border-b border-[var(--border-default)] pb-1 mb-1.5 text-[var(--content-heading)]">
                {dates[hoveredIdx]}
              </div>
              <div className="space-y-1.5">
                {seriesPaths.map((sp, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-[var(--content-muted)]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: sp.color }} />
                      {sp.label}:
                    </span>
                    <strong className="text-[var(--content-heading)]">
                      {sp.valueFormatter(sp.data[hoveredIdx])}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

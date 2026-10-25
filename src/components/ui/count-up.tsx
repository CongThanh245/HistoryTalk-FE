"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  /** ms */
  duration?: number;
  /** Format the running number (defaults to vi-VN grouping, no decimals). */
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString("vi-VN");

/** Numbers roll up from 0 when they first appear (and ease to new values after). */
export function CountUp({ value, duration = 900, format = defaultFormat, className }: CountUpProps) {
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    // Reduced motion: same path, zero duration — lands on the value in one frame.
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      fromRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{format(shown)}</span>;
}

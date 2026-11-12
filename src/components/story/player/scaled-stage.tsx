"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const W = 1280;
const H = 720;

/**
 * Renders children on a fixed 1280×720 stage scaled to fit its box, so the
 * preview looks the same whether it is docked small or shown full screen.
 */
export function ScaledStage({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => setScale(Math.min(box.clientWidth / W, box.clientHeight / H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="relative grid h-full w-full place-items-center overflow-hidden">
      <div style={{ width: W * scale, height: H * scale }} className="relative overflow-hidden rounded-md shadow-2xl">
        {scale > 0 && (
          <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
        )}
      </div>
    </div>
  );
}

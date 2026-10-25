import { cn } from "@/lib/utils/cn";

/**
 * Section divider drawn from the Đông Sơn drum: a band of tangent-linked circles
 * with the drum's sun star in the middle. Inherits colour from `currentColor`.
 */
export function DrumDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("drum-divider flex items-center gap-3 text-[var(--accent-brass)]", className)}>
      <DrumBand />
      <svg viewBox="-12 -12 24 24" className="h-6 w-6 shrink-0 drum-divider-sun">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M0 -11 L1.6 -4 L-1.6 -4Z" fill="currentColor" transform={`rotate(${i * 30})`} />
        ))}
        <circle r="3.6" fill="currentColor" />
      </svg>
      <DrumBand mirrored />
    </div>
  );
}

function DrumBand({ mirrored }: { mirrored?: boolean }) {
  // CSS mask fades the band out toward the page edge.
  return (
    <svg className={cn("h-4 min-w-0 flex-1", mirrored ? "drum-band-fade-r" : "drum-band-fade-l")} preserveAspectRatio="none">
      <defs>
        <pattern id={mirrored ? "drum-band-r" : "drum-band-l"} width="26" height="16" patternUnits="userSpaceOnUse">
          <line x1="0" y1="1" x2="26" y2="1" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="15" x2="26" y2="15" stroke="currentColor" strokeWidth="1" />
          <circle cx="13" cy="8" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="13" cy="8" r="1.3" fill="currentColor" />
          <path d="M0 4.2 L13 3.8 M13 12.2 L26 11.8" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill={`url(#${mirrored ? "drum-band-r" : "drum-band-l"})`} />
    </svg>
  );
}

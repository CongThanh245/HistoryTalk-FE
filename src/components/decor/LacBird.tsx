import { cn } from "@/lib/utils/cn";

/** A Lạc bird in the Đông Sơn engraving style — long beak, crest and trailing plumes. */
export function LacBird({ className }: { className?: string }) {
  return (
    <svg viewBox="-10 -6 108 50" className={cn("overflow-visible", className)} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M22 22 Q8 17 -6 25" />
        <path d="M22 24 Q6 26 -4 34" />
        <path d="M24 25 Q12 32 2 41" />
        <path d="M63 15 Q60 6 52 1" />
        <path d="M66 15 Q65 7 61 0" />
      </g>
      <path d="M20 22 Q34 13 52 17 Q58 18 60 21 Q50 27 36 27 Q25 28 20 22Z" fill="currentColor" />
      <path d="M57 18 Q63 13 70 16 L96 23 L68 22 Q61 23 57 21Z" fill="currentColor" />
      <g className="lac-wing">
        <path d="M32 20 Q36 3 54 -4 Q46 9 46 20Z" fill="currentColor" />
      </g>
      <circle cx="66" cy="17.5" r="1.3" className="fill-[var(--bg-main)]" />
    </svg>
  );
}

/** One bird glides across its (relative, overflow-hidden) parent every so often. Hidden for reduced motion. */
export function LacBirdFlight({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("lac-flight pointer-events-none absolute inset-x-0 h-12 overflow-hidden", className)}>
      <div className="lac-flight-path">
        <LacBird className="h-7 w-16 text-[var(--accent-brass)] opacity-50" />
      </div>
    </div>
  );
}

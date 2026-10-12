import { cn } from "@/lib/utils/cn";
import type { LocalContentScope } from "@/features/saas/types";

/**
 * Where a piece of learning content comes from. Official (Content Admin) and school / class content (teachers)
 * are never listed together without this tag: Chính thức = ink, Của trường = men lam, Của lớp = jade.
 */
export type ContentSource = "OFFICIAL" | LocalContentScope;

export const CONTENT_SOURCE_LABELS: Record<ContentSource, string> = {
  OFFICIAL: "Chính thức",
  SCHOOL: "Của trường",
  CLASS: "Của lớp",
};

const SOURCE_CLASS: Record<ContentSource, string> = {
  OFFICIAL: "border-[var(--text-primary)] text-[var(--text-primary)]",
  SCHOOL:
    "border-[color-mix(in_srgb,var(--men-lam)_55%,transparent)] bg-[color-mix(in_srgb,var(--men-lam)_10%,transparent)] text-[var(--men-lam)]",
  CLASS:
    "border-[color-mix(in_srgb,var(--jade)_55%,transparent)] bg-[color-mix(in_srgb,var(--jade)_10%,transparent)] text-[var(--jade)]",
};

export function ContentSourceTag({
  source,
  label,
  detail,
  className,
}: {
  source: ContentSource;
  /** Overrides the default label, e.g. "Chính thức (HistoryTalk)". */
  label?: string;
  /** Extra text after a dot, e.g. the classes: "Của lớp · 10A1, 11A1". */
  detail?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center whitespace-nowrap rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold uppercase leading-[1.3] tracking-[0.08em]",
        SOURCE_CLASS[source],
        className,
      )}
    >
      <span className="truncate">
        {label ?? CONTENT_SOURCE_LABELS[source]}
        {detail ? ` · ${detail}` : ""}
      </span>
    </span>
  );
}

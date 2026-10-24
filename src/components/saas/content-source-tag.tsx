import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { LocalContentScope } from "@/features/saas/types";

/**
 * Where a piece of learning content comes from, named after its owner rather than ranked: HistoryTalk (Content Admin,
 * ink + logo mark), Của trường (men lam), Của lớp (jade). Needed wherever sources share one list; pages holding a
 * single source say it in the sidebar section and breadcrumb instead.
 */
export type ContentSource = "OFFICIAL" | LocalContentScope;

export const CONTENT_SOURCE_LABELS: Record<ContentSource, string> = {
  OFFICIAL: "HistoryTalk",
  SCHOOL: "Của trường",
  CLASS: "Của lớp",
};

const SOURCE_CLASS: Record<ContentSource, string> = {
  OFFICIAL: "border-border-card text-[var(--text-primary)]",
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
  /** Overrides the default label, e.g. "Lớp riêng". */
  label?: string;
  /** Extra text after a dot, e.g. the classes: "Của lớp · 10A1, 11A1". */
  detail?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center whitespace-nowrap rounded-full border px-1.5 py-0.5 text-xs font-semibold leading-[1.3]",
        SOURCE_CLASS[source],
        className,
      )}
    >
      {source === "OFFICIAL" && (
        <Image src="/solo-logo.png" alt="" width={12} height={12} unoptimized className="mr-1 h-3 w-3 shrink-0 object-contain" />
      )}
      <span className="truncate">
        {label ?? CONTENT_SOURCE_LABELS[source]}
        {detail ? ` · ${detail}` : ""}
      </span>
    </span>
  );
}

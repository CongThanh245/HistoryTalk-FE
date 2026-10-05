import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/** Archive section heading: `[ LABEL ]`, condensed title and an ink rule, with an optional "see all" link. */
export function ArchiveHeading({
  title,
  description,
  action,
  className,
  as: Heading = "h2",
}: {
  /** Kept for compatibility; eyebrow labels are no longer shown. */
  label?: string;
  title: string;
  description?: string;
  action?: { href: string; text: string };
  className?: string;
  /** Use "h1" when the heading is the page title. */
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("archive-heading", className)}>
      <div className="min-w-0">
        <Heading className="archive-title">{title}</Heading>
        {description && <p>{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="archive-link hidden sm:inline-flex">
          {action.text} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { useHydrated } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { cn } from "@/lib/utils/cn";

/**
 * Slim marker on the official catalogs (/events, /characters, /quiz) for school accounts: this is the HistoryTalk
 * library curated by Content Admin, and class / school content lives in "Tư liệu lớp & trường".
 * Renders nothing for customers and staff.
 */
export function OfficialCatalogBanner({ className }: { className?: string }) {
  const role = useRole();
  const hydrated = useHydrated();
  if (!hydrated || (role !== "TEACHER" && role !== "SCHOOL_STUDENT")) return null;
  const href = role === "TEACHER" ? ROUTES.TEACHING.LOCAL : ROUTES.CLASS_MATERIALS;
  return (
    <div
      role="note"
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2",
        className,
      )}
    >
      <p className="flex flex-wrap items-center gap-2 text-[13px] text-content-text">
        <ContentSourceTag source="OFFICIAL" />
        <span>
          <strong className="font-bold">Thư viện HistoryTalk</strong> · Nội dung chính thức
        </span>
      </p>
      <Link href={href} className="archive-link">
        Tư liệu lớp &amp; trường <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

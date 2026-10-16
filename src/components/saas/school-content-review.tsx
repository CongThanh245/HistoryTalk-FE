"use client";

import { BookOpen, User } from "lucide-react";

import { LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalKind } from "@/services/local-content.service";

/* Shared bits of the School Admin review screen (src/app/school/content/page.tsx, Sprint 6 API). */

const KIND_ICON: Record<LocalKind, typeof BookOpen> = { CONTEXT: BookOpen, CHARACTER: User };

export function ContentKindLabel({ kind }: { kind: LocalKind }) {
  const Icon = KIND_ICON[kind];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-[var(--text-secondary)]">
      <Icon className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
      {LOCAL_KIND_LABELS[kind]}
    </span>
  );
}

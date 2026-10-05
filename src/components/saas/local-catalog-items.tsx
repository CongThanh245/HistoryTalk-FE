"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { localContentHref } from "@/components/saas/student-local-content-list";
import { LocalStatusBadge } from "@/components/saas/teaching-ui";
import { DEMO_STUDENT_ID, DEMO_TEACHER_ID } from "@/features/saas/mock-data";
import { useSaasStore } from "@/features/saas/store";
import type { Classroom, LocalCharacter, LocalContext } from "@/features/saas/types";

/**
 * Lịch sử địa phương trong các danh mục chung (Role Matrix row 14).
 * Local items stay in their own list and look (men-lam accent, "Địa phương" badge) so they never mix with
 * the global catalog that Content Admin curates. Only class members (Teacher, School Student) get anything.
 */

type CatalogKind = "CONTEXT" | "CHARACTER";
type ItemOf<K extends CatalogKind> = K extends "CONTEXT" ? LocalContext : LocalCharacter;

export interface LocalCatalogEntry<T> {
  item: T;
  /** The viewer's classes the item is shared with; the first one is used for the link. */
  classes: Classroom[];
  schoolName: string;
}

const ERA_LABEL: Record<LocalContext["era"], string> = {
  ANCIENT: "Cổ đại",
  MEDIEVAL: "Trung đại",
  MODERN: "Cận đại",
  CONTEMPORARY: "Hiện đại",
};

/** Classes of the logged-in Teacher / School Student (same rule as useMyClasses, kept inside a memo). */
function myClassesOf(classes: Classroom[], role: string | null | undefined) {
  if (role === "TEACHER") return classes.filter((c) => c.teacherIds.includes(DEMO_TEACHER_ID) || c.homeroomTeacherId === DEMO_TEACHER_ID);
  if (role === "SCHOOL_STUDENT") return classes.filter((c) => c.studentIds.includes(DEMO_STUDENT_ID));
  return [];
}

/**
 * Local items of one kind visible to the viewer's classes: published items for everyone in the class,
 * plus the teacher's own drafts / pending / hidden items (shown with a status badge). Trash is never listed.
 */
export function useLocalCatalog<K extends CatalogKind>(kind: K, role: string | null | undefined) {
  const classes = useSaasStore((s) => s.classes);
  const schools = useSaasStore((s) => s.schools);
  const localContent = useSaasStore((s) => s.localContent);

  return useMemo(() => {
    const myClasses = myClassesOf(classes, role);
    const schoolName = new Map(schools.map((s) => [s.id, s.name]));
    const entries: LocalCatalogEntry<ItemOf<K>>[] = [];
    for (const item of localContent) {
      if (item.kind !== kind || item.status === "TRASH") continue;
      const visible = item.status === "PUBLISHED" || (role === "TEACHER" && item.authorId === DEMO_TEACHER_ID);
      if (!visible) continue;
      const shared = myClasses.filter((c) => item.classIds.includes(c.id));
      if (shared.length === 0) continue;
      entries.push({ item: item as ItemOf<K>, classes: shared, schoolName: schoolName.get(item.schoolId) ?? "" });
    }
    entries.sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt));
    return { entries, isMember: myClasses.length > 0 };
  }, [classes, schools, localContent, kind, role]);
}

/** "Địa phương · 10A1, 11A1 · THPT Lê Hồng Phong" in the men-lam accent. */
export function LocalBadge({ classes, schoolName }: { classes: Classroom[]; schoolName: string }) {
  const parts = ["Địa phương", classes.map((c) => c.name).join(", "), schoolName].filter(Boolean);
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-[2px] border border-[color-mix(in_srgb,var(--men-lam)_45%,transparent)] bg-[color-mix(in_srgb,var(--men-lam)_10%,transparent)] px-2 py-0.5 text-[11px] font-bold text-[var(--men-lam)]"
    >
      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{parts.join(" · ")}</span>
    </span>
  );
}

const CARD =
  "group flex h-full flex-col gap-3 bg-[var(--bg-surface)] p-4 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-gold)]";

const formatYear = (y: number) => (y < 0 ? `${Math.abs(y)} TCN` : String(y));

export function LocalContextCard({ entry, showStatus }: { entry: LocalCatalogEntry<LocalContext>; showStatus: boolean }) {
  const { item, classes, schoolName } = entry;
  return (
    <Link href={localContentHref(classes[0].id, item.id)} className={CARD}>
      <span className="flex flex-wrap items-center gap-1.5">
        <LocalBadge classes={classes} schoolName={schoolName} />
        {showStatus && item.status !== "PUBLISHED" && <LocalStatusBadge status={item.status} />}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-extrabold tabular-nums leading-tight text-[var(--men-lam)]">
          {formatYear(item.year)}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-muted">{ERA_LABEL[item.era]}</span>
      </span>
      <span className="archive-title is-plain block text-lg leading-snug text-content-text group-hover:text-[var(--accent-gold)]">
        {item.title}
      </span>
      <span className="line-clamp-3 text-sm leading-relaxed text-content-muted">{item.summary}</span>
      <span className="mt-auto flex items-center justify-between gap-3 pt-1 text-[12px]">
        <span className="flex min-w-0 items-center gap-1 text-content-subtle">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.location}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-bold text-[var(--men-lam)]">
          Đọc tư liệu <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function LocalCharacterCard({ entry, showStatus }: { entry: LocalCatalogEntry<LocalCharacter>; showStatus: boolean }) {
  const { item, classes, schoolName } = entry;
  const lifespan =
    item.bornYear || item.deathYear ? `${item.bornYear ? formatYear(item.bornYear) : "?"} – ${item.deathYear ? formatYear(item.deathYear) : "?"}` : null;
  return (
    <Link href={localContentHref(classes[0].id, item.id)} className={CARD}>
      <span className="flex flex-wrap items-center gap-1.5">
        <LocalBadge classes={classes} schoolName={schoolName} />
        {showStatus && item.status !== "PUBLISHED" && <LocalStatusBadge status={item.status} />}
      </span>
      <span className="flex items-center gap-3">
        <span
          className="grid h-14 w-14 shrink-0 place-items-center rounded-[2px] bg-[var(--men-lam)] font-display text-xl font-extrabold leading-tight text-white"
          aria-hidden="true"
        >
          {initials(item.name)}
        </span>
        <span className="min-w-0">
          <span className="archive-title is-plain block text-lg leading-snug text-content-text group-hover:text-[var(--accent-gold)]">
            {item.name}
          </span>
          <span className="block text-[12px] text-content-muted">
            {item.title}
            {lifespan && ` · ${lifespan}`}
          </span>
        </span>
      </span>
      <span className="line-clamp-3 text-sm leading-relaxed text-content-muted">{item.biography}</span>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[12px] font-bold text-[var(--men-lam)]">
        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Xem và trò chuyện <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </Link>
  );
}

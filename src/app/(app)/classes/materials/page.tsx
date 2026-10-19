"use client";

// Bối cảnh & nhân vật: API Sprint 6 (đã xuất bản). BE chưa có API câu đố do giáo viên soạn.
import * as React from "react";
import Link from "next/link";
import { ArrowRight, FilePenLine } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { QueryState, localMeta } from "@/components/saas/local-content-ui";
import { SaasShell, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import { SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import type { LocalItem, LocalKind } from "@/services/local-content.service";

const KIND_LABEL: Record<LocalKind, string> = { CONTEXT: "Bối cảnh", CHARACTER: "Nhân vật" };
const KIND_ACTION: Record<LocalKind, string> = { CONTEXT: "Đọc tư liệu", CHARACTER: "Xem nhân vật" };

type Group = "CLASS" | "SCHOOL";

const GROUPS: { scope: Group; title: string; description: string; empty: string }[] = [
  {
    scope: "CLASS",
    title: "Của thầy cô",
    description: "Thầy cô soạn riêng cho lớp mình dạy.",
    empty: "Thầy cô chưa xuất bản tư liệu riêng nào.",
  },
  {
    scope: "SCHOOL",
    title: "Của trường",
    description: "Tư liệu dùng chung cho toàn trường.",
    empty: "Nhà trường chưa có tư liệu dùng chung nào.",
  },
];

/** One card: a published context / character. */
type Entry = { item: LocalItem; group: Group };

/** Tư liệu lớp & trường: class and school content of the workspace, kept apart from the official HistoryTalk library. */
export default function ClassMaterialsPage() {
  return (
    <SaasShell
      variant="app"
      live
      title="Tư liệu lớp & trường"
      description="Bối cảnh và nhân vật do thầy cô và nhà trường biên soạn. Sự kiện, nhân vật và câu đố của HistoryTalk nằm ở mục HistoryTalk trên thanh bên."
    >
      <Materials />
    </SaasShell>
  );
}

function Materials() {
  const role = useRole();
  const isTeacher = role === "TEACHER";
  const isStudent = role === "SCHOOL_STUDENT";
  const teacher = useTeacherLocalContent(isTeacher);
  const student = useStudentLocalContent(isStudent);
  const [kind, setKind] = React.useState<LocalKind | "ALL">("ALL");
  const [search, setSearch] = React.useState("");

  if (!isTeacher && !isStudent) {
    return <EmptyState title="Không có tư liệu lớp" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." />;
  }

  const query = isTeacher ? teacher : student;
  // Teachers also see their own drafts in "Quản lý tư liệu"; here only what students can see.
  const apiItems = (isTeacher ? [...teacher.contexts, ...teacher.characters] : student.items).filter((i) => i.isPublished);
  const all: Entry[] = apiItems
    .map((item): Entry => ({ item, group: item.contentScope === "SCHOOL_WIDE" ? "SCHOOL" : "CLASS" }))
    .sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt));

  const q = normalizeText(search);
  const keep = (e: Entry) => (kind === "ALL" || e.item.type === kind) && (!q || normalizeText(e.item.name).includes(q));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedFilter
          label="Loại tư liệu"
          value={kind}
          onChange={setKind}
          options={[
            { value: "ALL" as const, label: "Tất cả", count: all.length },
            ...(Object.keys(KIND_LABEL) as LocalKind[]).map((k) => ({
              value: k,
              label: KIND_LABEL[k],
              count: all.filter((e) => e.item.type === k).length,
            })),
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {isTeacher && (
            <Link href={ROUTES.TEACHING.LOCAL} className="btn-line">
              <FilePenLine className="h-4 w-4" aria-hidden="true" /> Quản lý tư liệu
            </Link>
          )}
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
        </div>
      </div>

      <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={query.refetch}>
        {GROUPS.map((g) => {
          const entries = all.filter((e) => e.group === g.scope && keep(e));
          return (
            <section key={g.scope} aria-labelledby={`materials-${g.scope}`} className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--text-primary)] pb-2">
                <div className="min-w-0 space-y-1">
                  <h2 id={`materials-${g.scope}`} className="archive-title is-plain flex flex-wrap items-center gap-2 text-2xl">
                    {g.title}
                    <ContentSourceTag source={g.scope} />
                  </h2>
                  <p className="text-sm text-content-muted">{g.description}</p>
                </div>
                <span className="text-xs tabular-nums text-content-muted">{entries.length} tư liệu</span>
              </div>
              {entries.length === 0 ? (
                <p className="py-6 text-center text-sm text-content-muted">{q || kind !== "ALL" ? "Không có tư liệu phù hợp bộ lọc." : g.empty}</p>
              ) : (
                <ul className="grid grid-cols-1 border-l border-t border-[var(--border-strong)] sm:grid-cols-2 xl:grid-cols-3">
                  {entries.map((e) => (
                    <li key={`${e.item.type}-${e.item.id}`} className="border-b border-r border-[var(--border-strong)]">
                      <MaterialCard entry={e} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </QueryState>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-[var(--border-strong)] px-4 py-3">
        <p className="flex flex-wrap items-center gap-2 text-sm text-content-text">
          <ContentSourceTag source="OFFICIAL" />
          Cần thêm tư liệu? Xem sự kiện, nhân vật và câu đố do HistoryTalk biên soạn.
        </p>
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href={ROUTES.EVENTS} className="archive-link">
            Sự kiện <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link href={ROUTES.CHARACTERS} className="archive-link">
            Nhân vật <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link href={ROUTES.QUIZ} className="archive-link">
            Câu đố <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </span>
      </div>
    </div>
  );
}

function MaterialCard({ entry }: { entry: Entry }) {
  const accent = entry.group === "SCHOOL" ? "text-[var(--men-lam)]" : "text-[var(--jade)]";
  const { item } = entry;

  return (
    <Link
      href={ROUTES.CLASS_MATERIAL_DETAIL(item.type, item.id)}
      className="group flex h-full flex-col gap-2 bg-[var(--bg-surface)] p-4 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
    >
      <span className="flex flex-wrap items-center gap-2">
        <ContentSourceTag source={entry.group} />
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-content-muted">{KIND_LABEL[item.type]}</span>
      </span>
      <span className="archive-title is-plain block text-lg leading-snug text-content-text group-hover:text-[var(--accent-gold)]">{item.name}</span>
      <span className="text-[12px] text-content-muted">{localMeta(item)}</span>
      {item.description && <span className="line-clamp-3 text-sm leading-relaxed text-content-muted">{item.description}</span>}
      <span className={`mt-auto inline-flex items-center gap-1 pt-1 text-[12px] font-bold ${accent}`}>
        {KIND_ACTION[item.type]} <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </Link>
  );
}

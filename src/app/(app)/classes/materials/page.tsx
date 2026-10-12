"use client";

// FAKE UI: màn này chạy bằng dữ liệu mẫu (src/features/saas/store.ts), chưa có API — chờ BE sprint sau.
import * as React from "react";
import Link from "next/link";
import { ArrowRight, FilePenLine, LibraryBig } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { SaasShell, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import { localContentHref } from "@/components/saas/student-local-content-list";
import { SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { formatYear } from "@/features/saas/hooks-teaching";
import { localTitle, useWorkspaceLibrary, type WorkspaceLocalEntry } from "@/features/saas/hooks-student";
import type { LocalContentKind, LocalContentScope } from "@/features/saas/types";

const KIND_LABEL: Record<LocalContentKind, string> = { CONTEXT: "Bối cảnh", CHARACTER: "Nhân vật", QUIZ: "Câu đố" };
const KIND_ACTION: Record<LocalContentKind, string> = { CONTEXT: "Đọc tư liệu", CHARACTER: "Xem và trò chuyện", QUIZ: "Luyện tập" };
const LEVEL_LABEL = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" } as const;

const GROUPS: { scope: LocalContentScope; title: string; description: string; empty: string }[] = [
  {
    scope: "CLASS",
    title: "Của lớp",
    description: "Thầy cô soạn và xuất bản riêng cho lớp, chỉ lớp được chia sẻ mới thấy.",
    empty: "Thầy cô chưa xuất bản tư liệu nào cho lớp.",
  },
  {
    scope: "SCHOOL",
    title: "Của trường",
    description: "Tư liệu dùng chung cho toàn trường, đã được nhà trường duyệt.",
    empty: "Nhà trường chưa có tư liệu dùng chung nào.",
  },
];

/** Tư liệu lớp & trường: class and school content of the workspace, kept apart from the official HistoryTalk library. */
export default function ClassMaterialsPage() {
  return (
    <SaasShell
      variant="app"
      title="Tư liệu lớp & trường"
      description="Bối cảnh, nhân vật và câu đố do thầy cô và nhà trường biên soạn. Nội dung chính thức của HistoryTalk nằm ở mục Thư viện HistoryTalk."
    >
      <Materials />
    </SaasShell>
  );
}

function Materials() {
  const role = useRole();
  const { classes, classItems, schoolItems } = useWorkspaceLibrary(role);
  const [kind, setKind] = React.useState<LocalContentKind | "ALL">("ALL");
  const [search, setSearch] = React.useState("");

  if (role !== "TEACHER" && role !== "SCHOOL_STUDENT") {
    return <EmptyState title="Không có tư liệu lớp" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." />;
  }
  if (classes.length === 0) {
    return <EmptyState icon={LibraryBig} title="Bạn chưa thuộc lớp nào" description="Tư liệu lớp và trường hiển thị khi bạn được xếp vào lớp." />;
  }

  const q = normalizeText(search);
  const keep = (e: WorkspaceLocalEntry) => (kind === "ALL" || e.item.kind === kind) && (!q || normalizeText(localTitle(e.item)).includes(q));
  const all = [...classItems, ...schoolItems];
  const byScope: Record<LocalContentScope, WorkspaceLocalEntry[]> = { CLASS: classItems.filter(keep), SCHOOL: schoolItems.filter(keep) };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedFilter
          label="Loại tư liệu"
          value={kind}
          onChange={setKind}
          options={[
            { value: "ALL" as const, label: "Tất cả", count: all.length },
            ...(Object.keys(KIND_LABEL) as LocalContentKind[]).map((k) => ({
              value: k,
              label: KIND_LABEL[k],
              count: all.filter((e) => e.item.kind === k).length,
            })),
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {role === "TEACHER" && (
            <Link href={ROUTES.TEACHING.LOCAL} className="btn-line">
              <FilePenLine className="h-4 w-4" aria-hidden="true" /> Quản lý tư liệu
            </Link>
          )}
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
        </div>
      </div>

      {GROUPS.map((g) => {
        const entries = byScope[g.scope];
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
                  <li key={e.item.id} className="border-b border-r border-[var(--border-strong)]">
                    <MaterialCard entry={e} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-[var(--border-strong)] px-4 py-3">
        <p className="flex flex-wrap items-center gap-2 text-sm text-content-text">
          <ContentSourceTag source="OFFICIAL" />
          Cần thêm tư liệu? Xem sự kiện, nhân vật và câu đố chính thức trong Thư viện HistoryTalk.
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

function MaterialCard({ entry }: { entry: WorkspaceLocalEntry }) {
  const { item, classes } = entry;
  const accent = item.scope === "SCHOOL" ? "text-[var(--men-lam)]" : "text-[var(--jade)]";
  const meta =
    item.kind === "CONTEXT"
      ? `${formatYear(item.year)} · ${item.location}`
      : item.kind === "CHARACTER"
        ? [item.title, item.bornYear != null || item.deathYear != null ? `${formatYear(item.bornYear)} – ${formatYear(item.deathYear)}` : null]
            .filter(Boolean)
            .join(" · ")
        : `${item.questions.length} câu · ${item.durationMinutes} phút · ${LEVEL_LABEL[item.level]}`;
  const excerpt = item.kind === "CONTEXT" ? item.summary : item.kind === "CHARACTER" ? item.biography : null;

  return (
    <Link
      href={localContentHref(classes[0].id, item.id)}
      className="group flex h-full flex-col gap-2 bg-[var(--bg-surface)] p-4 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
    >
      <span className="flex flex-wrap items-center gap-2">
        <ContentSourceTag source={item.scope} detail={item.scope === "CLASS" ? classes.map((c) => c.name).join(", ") : undefined} />
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-content-muted">{KIND_LABEL[item.kind]}</span>
      </span>
      <span className="archive-title is-plain block text-lg leading-snug text-content-text group-hover:text-[var(--accent-gold)]">
        {localTitle(item)}
      </span>
      <span className="text-[12px] text-content-muted">{meta}</span>
      {excerpt && <span className="line-clamp-3 text-sm leading-relaxed text-content-muted">{excerpt}</span>}
      <span className={`mt-auto inline-flex items-center gap-1 pt-1 text-[12px] font-bold ${accent}`}>
        {KIND_ACTION[item.kind]} <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </Link>
  );
}

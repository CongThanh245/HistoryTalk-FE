"use client";

// Bối cảnh & nhân vật: API Sprint 6 (đã xuất bản). BE chưa có API câu đố do giáo viên soạn.
import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, FilePenLine, Map as MapIcon, SearchX } from "lucide-react";

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
    title: "Thầy cô soạn cho lớp",
    description: "Chỉ học sinh trong lớp mới xem được.",
    empty: "Thầy cô chưa đăng tư liệu nào cho lớp.",
  },
  {
    scope: "SCHOOL",
    title: "Nhà trường chia sẻ",
    description: "Dùng chung cho mọi lớp trong trường.",
    empty: "Nhà trường chưa chia sẻ tư liệu nào.",
  },
];

/** One card: a published context / character. */
type Entry = { item: LocalItem; group: Group };

/** Kho tư liệu: class and school content of the workspace, kept apart from the official HistoryTalk library. */
export default function ClassMaterialsPage() {
  return (
    <SaasShell
      variant="app"
      live
      title="Kho tư liệu"
      description="Bối cảnh lịch sử và nhân vật do thầy cô, nhà trường soạn riêng cho lớp học."
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
  const filtering = Boolean(q) || kind !== "ALL";
  const keep = (e: Entry) => (kind === "ALL" || e.item.type === kind) && (!q || normalizeText(e.item.name).includes(q));
  const shown = all.filter(keep);

  const manageLink = isTeacher && (
    <Link href={ROUTES.TEACHING.LOCAL} className="btn-ink">
      <FilePenLine className="h-4 w-4" aria-hidden="true" /> {all.length === 0 ? "Soạn tư liệu" : "Quản lý tư liệu"}
    </Link>
  );

  return (
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={query.refetch}>
      {all.length === 0 ? (
        <EmptyState
          size="lg"
          icon={BookOpen}
          title="Kho tư liệu đang trống"
          description={
            isTeacher
              ? "Tư liệu bạn soạn và xuất bản sẽ hiện ở đây cho học sinh. Trong lúc đó, lớp vẫn dùng được thư viện HistoryTalk."
              : "Khi thầy cô hoặc nhà trường đăng tư liệu, chúng sẽ hiện ở đây. Trong lúc chờ, hãy khám phá thư viện HistoryTalk."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {manageLink}
              <Link href={ROUTES.EVENTS} className="btn-line">
                Sự kiện
              </Link>
              <Link href={ROUTES.CHARACTERS} className="btn-line">
                Nhân vật
              </Link>
              <Link href={ROUTES.QUIZ} className="btn-line">
                Câu đố
              </Link>
            </div>
          }
        />
      ) : (
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
              <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
              <Link href={ROUTES.CLASS_MAP} className="btn-line">
                <MapIcon className="h-4 w-4" aria-hidden="true" /> Xem trên bản đồ
              </Link>
              {manageLink}
            </div>
          </div>

          {filtering && shown.length === 0 ? (
            <EmptyState
              size="sm"
              icon={SearchX}
              title="Không tìm thấy tư liệu"
              description="Thử từ khoá khác hoặc chọn lại loại tư liệu."
              action={
                <button
                  type="button"
                  className="btn-line"
                  onClick={() => {
                    setSearch("");
                    setKind("ALL");
                  }}
                >
                  Xoá bộ lọc
                </button>
              }
            />
          ) : (
            GROUPS.map((g) => {
              const entries = shown.filter((e) => e.group === g.scope);
              // While filtering, hide groups with no match instead of repeating "nothing here".
              if (filtering && entries.length === 0) return null;
              return (
                <section key={g.scope} aria-labelledby={`materials-${g.scope}`} className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 id={`materials-${g.scope}`} className="archive-title is-plain text-xl">
                      {g.title}
                    </h2>
                    <span className="text-xs tabular-nums text-content-muted">{entries.length} tư liệu</span>
                    <p className="w-full text-sm text-content-muted sm:w-auto">{g.description}</p>
                  </div>
                  {entries.length === 0 ? (
                    <p className="rounded-[2px] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-content-muted">
                      {g.empty}
                    </p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {entries.map((e) => (
                        <li key={`${e.item.type}-${e.item.id}`}>
                          <MaterialCard entry={e} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })
          )}

          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-content-muted">
            <span>Cần thêm tư liệu? Thư viện HistoryTalk có sẵn:</span>
            <Link href={ROUTES.EVENTS} className="archive-link">
              Sự kiện <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link href={ROUTES.CHARACTERS} className="archive-link">
              Nhân vật <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link href={ROUTES.QUIZ} className="archive-link">
              Câu đố <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </p>
        </div>
      )}
    </QueryState>
  );
}

function MaterialCard({ entry }: { entry: Entry }) {
  const accent = entry.group === "SCHOOL" ? "text-[var(--men-lam)]" : "text-[var(--jade)]";
  const { item } = entry;

  return (
    <Link
      href={ROUTES.CLASS_MATERIAL_DETAIL(item.type, item.id)}
      className="group flex h-full flex-col gap-2 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 motion-safe:transition-colors hover:border-[var(--accent-gold)] hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
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

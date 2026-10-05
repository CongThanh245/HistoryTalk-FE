"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, ArrowRight, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SaasShell, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import {
  ALL,
  AssignmentTypeBadge,
  ClassSelect,
  KpiTile,
  ScoreLegend,
  ScoreValue,
  TD,
  TH,
  TR,
  TableShell,
} from "@/components/saas/teaching-ui";
import { DailyBarChart, InlineBar } from "@/components/saas/teaching-chart";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import {
  formatDateTime,
  formatPercent,
  formatScore,
  relativeDue,
  useDashboardStats,
  useTeachingData,
  type StudentRow,
} from "@/features/saas/hooks-teaching";
import { givenName } from "@/components/saas/class-roster";
import { cn } from "@/lib/utils/cn";

/** Teacher dashboard: test scores and AI interaction of the classes they teach (Role Matrix row 24). */
export default function TeachingDashboardPage() {
  return (
    <SaasShell variant="app" title="Tổng quan giảng dạy" description="Điểm bài kiểm tra, tiến độ nộp bài và mức độ tương tác với AI của các lớp bạn dạy.">
      <React.Suspense fallback={null}>
        <Dashboard />
      </React.Suspense>
    </SaasShell>
  );
}

function Dashboard() {
  const role = useRole();
  const data = useTeachingData(role);
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("classId");
  const classId = requested && data.classById.has(requested) ? requested : ALL;
  const classIds = React.useMemo(() => (classId === ALL ? data.classes.map((c) => c.id) : [classId]), [classId, data.classes]);
  const stats = useDashboardStats(data, classIds);

  const setClass = (v: string) => router.replace(v === ALL ? ROUTES.TEACHING.HOME : `${ROUTES.TEACHING.HOME}?classId=${encodeURIComponent(v)}`, { scroll: false });

  if (data.classes.length === 0) {
    return <EmptyState title="Chưa có lớp giảng dạy" description="Quản trị trường sẽ phân công lớp cho bạn. Khi đó số liệu sẽ hiện ở đây." />;
  }

  const newHref = classId === ALL ? ROUTES.TEACHING.ASSIGNMENT_NEW : `${ROUTES.TEACHING.ASSIGNMENT_NEW}?classId=${encodeURIComponent(classId)}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ClassSelect classes={data.classes} value={classId} onChange={setClass} />
        <div className="flex flex-wrap gap-2">
          <Link href={ROUTES.TEACHING.ASSIGNMENTS} className="btn-line">
            Bài tập
          </Link>
          <Link href={newHref} className="btn-crimson">
            <Plus className="h-4 w-4" aria-hidden="true" /> Giao bài tập
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Bài đang mở" value={stats.openAssignments.length} hint={`${stats.assignments.length} bài đã giao`} />
        <KpiTile
          label="Tỷ lệ nộp bài"
          value={formatPercent(stats.submissionRate)}
          accent="text-[var(--jade)]"
          hint={`${stats.submissionDone}/${stats.submissionTotal} lượt nộp trên các bài đã mở`}
        />
        <KpiTile
          label="Điểm TB bài kiểm tra"
          value={formatScore(stats.averageScore)}
          accent="text-[var(--men-lam)]"
          hint={`Thang 10 · ${stats.gradedTests.length} bài tính điểm`}
        />
        <KpiTile
          label="Tin nhắn AI · 7 ngày"
          value={formatNumber(stats.messages7)}
          accent="text-[var(--gold-leaf)]"
          hint={`${stats.rows.length} học sinh`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <AttentionList rows={stats.attention} showClass={classId === ALL} />
        <UpcomingList stats={stats} />
      </div>

      <GradeBook rows={stats.rows} tests={stats.gradedTests} showClass={classId === ALL} />

      <div className="space-y-4">
        <SectionHeading title="Tương tác với AI" description="Số tin nhắn học sinh gửi cho nhân vật lịch sử trong 14 ngày gần nhất." />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <Panel>
            <DailyBarChart data={stats.perDay} caption="Tin nhắn mỗi ngày" />
          </Panel>
          <ChatRanking rows={stats.rows} />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Cần quan tâm ───────────────────────── */
function AttentionList({ rows, showClass }: { rows: StudentRow[]; showClass: boolean }) {
  return (
    <div className="space-y-4">
      <SectionHeading title="Cần quan tâm" description="Học sinh thiếu từ 2 bài trở lên hoặc điểm trung bình dưới 5." />
      {rows.length === 0 ? (
        <p className="text-sm text-content-muted">Chưa có học sinh nào cần lưu ý.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.slice(0, 8).map((r) => (
            <li key={r.student.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
              <span className="min-w-0 flex-1 font-semibold text-content-heading">
                {r.student.fullName}
                {showClass && <span className="ml-2 text-xs font-normal text-content-muted">Lớp {r.classroom.name}</span>}
              </span>
              {r.missing >= 2 && <span className="text-xs font-bold text-[var(--accent-danger)]">Thiếu {r.missing} bài</span>}
              <span className="text-xs text-content-muted">
                ĐTB <ScoreValue value={r.average} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 8 && <p className="text-xs text-content-muted">và {rows.length - 8} học sinh khác.</p>}
    </div>
  );
}

/* ───────────────────────── Hạn nộp sắp tới ───────────────────────── */
function UpcomingList({ stats }: { stats: ReturnType<typeof useDashboardStats> }) {
  const classById = new Map(stats.classes.map((c) => [c.id, c]));
  return (
    <div className="space-y-4">
      <SectionHeading title="Hạn nộp sắp tới" />
      {stats.upcoming.length === 0 ? (
        <p className="text-sm text-content-muted">Không có bài nào sắp đến hạn.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {stats.upcoming.slice(0, 6).map((a) => (
            <li key={a.id} className="py-2.5">
              <Link href={ROUTES.TEACHING.ASSIGNMENT_DETAIL(a.id)} className="group block">
                <span className="flex items-center gap-2">
                  <AssignmentTypeBadge type={a.type} />
                  <span className="text-xs text-content-muted">Lớp {classById.get(a.classId)?.name}</span>
                </span>
                <span className="mt-1 block text-sm font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{a.title}</span>
                <span className="text-xs text-content-muted">
                  Hạn {formatDateTime(a.dueAt)} · {relativeDue(a.dueAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── Sổ điểm ───────────────────────── */
type SortKey = "name" | "class" | "average" | string;

function GradeBook({
  rows,
  tests,
  showClass,
}: {
  rows: StudentRow[];
  tests: ReturnType<typeof useDashboardStats>["gradedTests"];
  showClass: boolean;
}) {
  const [sort, setSort] = React.useState<{ key: SortKey; desc: boolean }>({ key: "name", desc: false });

  const sorted = React.useMemo(() => {
    const val = (r: StudentRow): string | number | null => {
      if (sort.key === "name") return givenName(r.student.fullName) + " " + r.student.fullName;
      if (sort.key === "class") return r.classroom.name;
      if (sort.key === "average") return r.average;
      return r.scores.get(sort.key) ?? null;
    };
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "vi");
      return sort.desc ? -cmp : cmp;
    });
  }, [rows, sort]);

  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" && key !== "class" }));

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Sổ điểm bài kiểm tra"
        description="Điểm quy về thang 10. Bấm tiêu đề cột để sắp xếp."
      />
      <ScoreLegend />
      {tests.length === 0 ? (
        <p className="text-sm text-content-muted">Chưa có bài kiểm tra tính điểm nào.</p>
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-[var(--border-strong)]">
              <SortHead sort={sort} onSort={toggle} k="name" className="sticky left-0 z-10 bg-[var(--bg-surface)]">Học sinh</SortHead>
              {showClass && <SortHead sort={sort} onSort={toggle} k="class">Lớp</SortHead>}
              {tests.map((t) => (
                <SortHead sort={sort} onSort={toggle} key={t.id} k={t.id} className="max-w-[160px]">
                  <span className="block max-w-[140px] truncate normal-case tracking-normal" title={t.title}>
                    {t.title}
                  </span>
                </SortHead>
              ))}
              <SortHead sort={sort} onSort={toggle} k="average">Trung bình</SortHead>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.student.id} className={TR}>
                <td className={cn(TD, "sticky left-0 z-10 bg-[var(--bg-surface)] font-medium text-content-heading")}>{r.student.fullName}</td>
                {showClass && <td className={cn(TD, "text-content-muted")}>{r.classroom.name}</td>}
                {tests.map((t) => (
                  <td key={t.id} className={cn(TD, "text-center")}>
                    {t.classId === r.classroom.id ? <ScoreValue value={r.scores.get(t.id) ?? null} /> : <span className="text-content-subtle">·</span>}
                  </td>
                ))}
                <td className={cn(TD, "text-center text-base")}>
                  <ScoreValue value={r.average} />
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

function SortHead({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k: SortKey;
  sort: { key: SortKey; desc: boolean };
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.desc ? ArrowDown : ArrowUp;
  return (
    <th className={cn(TH, className)} aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => onSort(k)} className="inline-flex items-center gap-1 uppercase hover:text-[var(--text-primary)]">
        {children}
        <Icon className="h-3 w-3 opacity-70" aria-hidden="true" />
      </button>
    </th>
  );
}

/* ───────────────────────── Xếp hạng tương tác ───────────────────────── */
function ChatRanking({ rows }: { rows: StudentRow[] }) {
  const [by, setBy] = React.useState<"messages" | "tokens">("messages");
  const ranked = [...rows].sort((a, b) => b[by] - a[by]).slice(0, 10);
  const max = ranked[0]?.[by] ?? 0;
  return (
    <Panel className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="archive-title is-plain text-xl">Học sinh tích cực</h3>
        <div role="group" aria-label="Xếp hạng theo" className="flex">
          {(["messages", "tokens"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={by === k}
              onClick={() => setBy(k)}
              className={cn(
                "h-7 border px-2.5 text-[11px] font-bold first:rounded-l-[2px] last:rounded-r-[2px]",
                by === k
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                  : "border-[var(--border-strong)] text-[var(--text-secondary)]",
              )}
            >
              {k === "messages" ? "Tin nhắn" : "Token"}
            </button>
          ))}
        </div>
      </div>
      {ranked.length === 0 || max === 0 ? (
        <p className="text-sm text-content-muted">Chưa có tương tác nào.</p>
      ) : (
        <ol className="space-y-2.5">
          {ranked.map((r, i) => (
            <li key={r.student.id} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-content-muted">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-content-heading">{r.student.fullName}</span>
                <span className="shrink-0 text-xs tabular-nums text-content-muted">
                  {formatNumber(r.messages)} tin · {formatNumber(r.tokens)} token
                </span>
              </div>
              <div className="ml-7 mt-1">
                <InlineBar value={r[by]} max={max} className={by === "tokens" ? "fill-[var(--gold-leaf)]" : "fill-[var(--accent-gold)]"} />
              </div>
            </li>
          ))}
        </ol>
      )}
      <Link href={ROUTES.TEACHING.ASSIGNMENTS} className="archive-link">
        Bài Chat AI <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </Panel>
  );
}

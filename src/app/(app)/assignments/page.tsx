"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardList, Hourglass, TimerOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel, SaasShell, SectionHeading } from "@/components/saas/saas-ui";
import { StudentAssignmentCard } from "@/components/saas/student-assignment-card";
import { StudentLocalContentList } from "@/components/saas/student-local-content-list";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useStudentAssignments, type AssignmentBucket, type StudentAssignmentRow } from "@/features/saas/hooks-student";
import { cn } from "@/lib/utils/cn";

type Tab = "TODO" | "DUE_SOON" | "DONE" | "OVERDUE";

const TABS: { id: Tab; label: string; color: string; icon: typeof ClipboardList; empty: string }[] = [
  { id: "TODO", label: "Cần làm", color: "var(--accent-gold)", icon: ClipboardList, empty: "Em đã làm hết bài được giao. Tuyệt vời!" },
  { id: "DUE_SOON", label: "Sắp hết hạn", color: "var(--gold-leaf)", icon: Hourglass, empty: "Không có bài nào hết hạn trong 48 giờ tới." },
  { id: "DONE", label: "Đã nộp", color: "var(--jade)", icon: CheckCircle2, empty: "Chưa có bài nào được nộp." },
  { id: "OVERDUE", label: "Quá hạn", color: "var(--accent-danger)", icon: TimerOff, empty: "Không có bài nào quá hạn." },
];

const inTab = (tab: Tab, bucket: AssignmentBucket) =>
  tab === "TODO" ? bucket === "TODO" || bucket === "DUE_SOON" : bucket === tab;

/** Học sinh: bài tập & bài kiểm tra được giao (Role Matrix row 17). */
export default function MyAssignmentsPage() {
  const role = useRole();
  return (
    <SaasShell
      variant="app"
      title="Bài tập được giao"
      description="Đọc sự kiện, trò chuyện với nhân vật và làm bài kiểm tra thầy cô đã giao cho lớp em."
    >
      {role === "SCHOOL_STUDENT" ? (
        <AssignmentsBoard role={role} />
      ) : (
        <EmptyState title="Trang dành cho học sinh" description="Chỉ tài khoản học sinh của trường mới có bài tập được giao." />
      )}
    </SaasShell>
  );
}

function AssignmentsBoard({ role }: { role: string }) {
  const { rows, classes } = useStudentAssignments(role);
  const [tab, setTab] = React.useState<Tab>("TODO");

  const counts = React.useMemo(() => {
    const c: Record<Tab, number> = { TODO: 0, DUE_SOON: 0, DONE: 0, OVERDUE: 0 };
    for (const r of rows) for (const t of TABS) if (inTab(t.id, r.bucket)) c[t.id] += 1;
    return c;
  }, [rows]);

  const shown: StudentAssignmentRow[] = React.useMemo(() => {
    const list = rows.filter((r) => inTab(tab, r.bucket));
    // Done / overdue: most recent first.
    return tab === "DONE" || tab === "OVERDUE" ? list.slice().reverse() : list;
  }, [rows, tab]);

  if (classes.length === 0) {
    return <EmptyState title="Em chưa thuộc lớp nào" description="Khi nhà trường xếp em vào lớp, bài tập của lớp sẽ hiện ở đây." />;
  }

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div role="tablist" aria-label="Lọc bài tập" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const selected = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={selected}
                aria-controls="assignment-panel"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-3 rounded-[2px] border px-3 py-2.5 text-left motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]",
                  selected ? "border-[var(--text-primary)]" :"border-[var(--border-strong)] bg-transparent hover:border-[var(--text-primary)]",
                )}
                style={selected ? { background: `color-mix(in srgb, ${t.color} 9%, var(--bg-surface))` } : undefined}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[2px] text-white" style={{ background: t.color }} aria-hidden="true">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-2xl font-extrabold tabular-nums leading-none text-content-text">{counts[t.id]}</span>
                  <span className="block truncate text-[12px] font-bold text-content-muted">{t.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="assignment-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-3">
          {shown.length === 0 ? (
            <EmptyState icon={active.icon} title={active.label} description={active.empty} size="sm" />
          ) : (
            shown.map((row) => <StudentAssignmentCard key={row.assignment.id} row={row} />)
          )}
        </div>
      </div>

      <Panel>
        <SectionHeading
          title="Tư liệu địa phương của lớp"
          description="Bối cảnh, nhân vật và bài luyện tập do thầy cô biên soạn về lịch sử quê hương."
        />
        <div className="space-y-5">
          {classes.map((c) => (
            <div key={c.id} className="space-y-2">
              {classes.length > 1 && <p className="text-[13px] font-bold text-content-text">Lớp {c.name}</p>}
              <StudentLocalContentList classroom={c} role={role} />
            </div>
          ))}
        </div>
        <Link href={ROUTES.GRADES} className="archive-link">
          Xem bảng điểm
        </Link>
      </Panel>
    </div>
  );
}

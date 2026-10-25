"use client";

// Bai tap duoc giao cua hoc sinh: GET /student/assignments (API that, khong mock).
import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  ShieldCheck,
  TimerOff,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import {
  AssignmentListSkeleton,
  AssignmentLoadError,
  StudentAssignmentCard,
  assignmentBucket,
  parseLocal,
  type AssignmentBucket,
} from "@/components/saas/student-assignment-card";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useMyAssignments } from "@/features/saas/hooks-assignment-api";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import type { StudentAssignment } from "@/services/assignment.service";
import { cn } from "@/lib/utils/cn";

type Tab = AssignmentBucket;

const TABS: {
  id: Tab;
  label: string;
  color: string;
  icon: typeof ClipboardList;
  empty: string;
}[] = [
  {
    id: "TODO",
    label: "Cần làm",
    color: "var(--accent-gold)",
    icon: ClipboardList,
    empty: "Bạn đã làm hết bài được giao. Tuyệt vời!",
  },
  {
    id: "DUE_SOON",
    label: "Sắp hết hạn",
    color: "var(--gold-leaf)",
    icon: Hourglass,
    empty: "Không có bài nào hết hạn trong 48 giờ tới.",
  },
  {
    id: "DONE",
    label: "Đã nộp",
    color: "var(--jade)",
    icon: CheckCircle2,
    empty: "Chưa có bài nào được nộp.",
  },
  {
    id: "OVERDUE",
    label: "Quá hạn",
    color: "var(--accent-danger)",
    icon: TimerOff,
    empty: "Không có bài nào quá hạn.",
  },
  {
    id: "EXEMPTED",
    label: "Được miễn",
    color: "var(--men-lam)",
    icon: ShieldCheck,
    empty: "Bạn không được miễn bài nào.",
  },
];

// "Cần làm" gom ca bai sap het han.
const inTab = (tab: Tab, bucket: AssignmentBucket) =>
  tab === "TODO" ? bucket === "TODO" || bucket === "DUE_SOON" : bucket === tab;

const PAGE_SIZE = 100;

/** Học sinh: bài tập được giao (Role Matrix row 17). */
export default function MyAssignmentsPage() {
  const role = useRole();
  return (
    <SaasShell
      variant="app"
      title="Bài tập được giao"
      description="Đọc bối cảnh, trò chuyện với nhân vật và làm bài kiểm tra thầy cô đã giao cho lớp của bạn."
    >
      {role === "SCHOOL_STUDENT" ? (
        <AssignmentsBoard />
      ) : (
        <EmptyState
          title="Trang dành cho học sinh"
          description="Chỉ tài khoản học sinh của trường mới có bài tập được giao."
        />
      )}
    </SaasShell>
  );
}

function AssignmentsBoard() {
  const { data, isLoading, isError, error, refetch } = useMyAssignments({
    page: 0,
    size: PAGE_SIZE,
  });
  const [tab, setTab] = React.useState<Tab>("TODO");

  const rows = React.useMemo(
    () => (data?.items ?? []).map((a) => ({ a, bucket: assignmentBucket(a) })),
    [data],
  );

  const counts = React.useMemo(() => {
    const c: Record<Tab, number> = {
      TODO: 0,
      DUE_SOON: 0,
      DONE: 0,
      OVERDUE: 0,
      EXEMPTED: 0,
    };
    for (const r of rows)
      for (const t of TABS) if (inTab(t.id, r.bucket)) c[t.id] += 1;
    return c;
  }, [rows]);

  const shown: StudentAssignment[] = React.useMemo(() => {
    const list = rows.filter((r) => inTab(tab, r.bucket)).map((r) => r.a);
    const due = (a: StudentAssignment) =>
      parseLocal(a.deadline)?.getTime() ?? 0;
    // Viec can lam: han gan nhat truoc; da xong / qua han: moi nhat truoc.
    return list.sort((x, y) =>
      tab === "TODO" || tab === "DUE_SOON" ? due(x) - due(y) : due(y) - due(x),
    );
  }, [rows, tab]);

  if (isLoading) return <AssignmentListSkeleton />;
  if (isError) {
    return (
      <AssignmentLoadError
        message={apiErrorMessage(
          error,
          "Vui lòng kiểm tra kết nối rồi thử lại.",
        )}
        onRetry={() => void refetch()}
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState mascot="idle"
        title="Chưa có bài tập nào"
        description="Khi thầy cô giao bài cho lớp của bạn, bài sẽ hiện ở đây."
        action={
          <Link href={ROUTES.CLASSES} className="archive-link">
            Lớp học của bạn
          </Link>
        }
      />
    );
  }

  const active = TABS.find((t) => t.id === tab)!;
  const truncated = (data?.totalElements ?? 0) > rows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Lọc bài tập"
          className="flex min-w-0 flex-1 gap-5 overflow-x-auto shadow-[inset_0_-1px_0_var(--border-default)] [scrollbar-width:none]"
        >
          {TABS.map((t) => {
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
                  "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 text-sm motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]",
                  selected
                    ? "border-[var(--accent-gold)] font-semibold text-content-heading"
                    : "border-transparent font-medium text-[var(--text-tertiary)] hover:text-content-heading",
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: t.color }}
                  aria-hidden="true"
                />
                {t.label}
                <span
                  className={cn(
                    "text-xs font-normal tabular-nums text-content-subtle",
                  )}
                >
                  {counts[t.id]}
                </span>
              </button>
            );
          })}
        </div>
        <Link
          href={ROUTES.GRADES}
          className="inline-flex items-center gap-2 rounded-sm border border-[var(--border-strong)] px-3 py-1.5 text-[13px] font-semibold text-content-text motion-safe:transition-colors hover:border-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Xem bảng điểm
        </Link>
      </div>

      <div
        id="assignment-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="space-y-3"
      >
        {shown.length === 0 ? (
          <EmptyState
            icon={active.icon}
            title={active.label}
            description={active.empty}
            size="sm"
          />
        ) : (
          shown.map((a) => (
            <StudentAssignmentCard key={a.assignmentId} assignment={a} />
          ))
        )}
      </div>

      {truncated && (
        <p className="text-[12px] text-content-muted">
          Đang hiện {rows.length}/{data?.totalElements} bài gần nhất.
        </p>
      )}
    </div>
  );
}

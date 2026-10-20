"use client";

import Link from "next/link";
import { ChevronRight, LibraryBig } from "lucide-react";
import { DailyQuestsCard } from "@/components/home/daily-quests-card";
import { ApiClassroomSideCard } from "@/components/saas/api-classroom-ui";
import { StudentClassAssignments } from "@/components/saas/student-class-assignments";
import { ROUTES } from "@/constants/routes";
import { useStudentLocalContent } from "@/features/saas/hooks-local-content";
import type { ApiClassroom } from "@/services/school.service";
import { useAuthStore } from "@/store/auth.store";

/**
 * Trang đầu "Không gian lớp học" của học sinh trường (/classes): lớp (GET /classrooms), bài cần làm
 * (GET /student/assignments) và tư liệu trường đã xuất bản (GET /student/local-contents/...).
 */

function greeting(now: Date) {
  const h = now.getHours();
  return h < 11 ? "Chào buổi sáng" : h < 13 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
}

export function StudentWorkspace({ classes }: { classes: ApiClassroom[] }) {
  const user = useAuthStore((s) => s.user);
  const now = new Date();
  const name = user?.fullName || user?.userName || "em";
  const firstName = name.trim().split(/\s+/).pop();
  const schoolName = classes.find((c) => c.schoolName)?.schoolName;
  const dateLabel = now.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="space-y-8">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-content-muted first-letter:uppercase">{dateLabel}</p>
        <p className="archive-title is-plain text-2xl sm:text-3xl">
          {greeting(now)}, {firstName}!
        </p>
        <p className="text-sm text-content-muted">
          Lớp {classes.map((c) => c.className).join(", ")}
          {schoolName && <> · {schoolName}</>}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <section aria-labelledby="ws-todo" className="space-y-3">
            <h2 id="ws-todo" className="archive-title is-plain text-xl">
              Bài cần làm
            </h2>
            <StudentClassAssignments openOnly limit={5} />
          </section>

          <section aria-labelledby="ws-materials" className="space-y-3">
            <h2 id="ws-materials" className="archive-title is-plain text-xl">
              Kho tư liệu
            </h2>
            <MaterialsPreview />
          </section>
        </div>

        <div className="grid min-w-0 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {classes.map((c) => (
            <ApiClassroomSideCard key={c.id} classroom={c} />
          ))}
          <Link
            href={ROUTES.EVENTS}
            className="group flex items-center gap-3 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 motion-safe:transition-colors hover:bg-[var(--bg-elevated)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
          >
            <LibraryBig className="h-6 w-6 shrink-0 text-[var(--text-primary)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-bold text-content-text group-hover:text-[var(--accent-gold)]">Thư viện HistoryTalk</span>
              </span>
              <span className="block text-[12px] text-content-muted">Sự kiện, nhân vật và câu đố do HistoryTalk biên soạn để tự học thêm.</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <DailyQuestsCard />
    </div>
  );
}

const MATERIALS_PREVIEW = 4;

/** Vai tu lieu truong moi nhat; day du o /classes/materials. */
function MaterialsPreview() {
  const { items, isLoading, isError } = useStudentLocalContent();
  if (isLoading) return <p className="text-sm text-content-muted">Đang tải tư liệu...</p>;
  if (isError || items.length === 0) {
    return (
      <p className="rounded-[2px] border border-dashed border-[var(--border-strong)] px-4 py-3 text-sm text-content-muted">
        Chưa có tư liệu. Thầy cô đăng tư liệu nào sẽ hiện ở đây.
      </p>
    );
  }
  const latest = items
    .slice()
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, MATERIALS_PREVIEW);
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
        {latest.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link href={ROUTES.CLASS_MATERIAL_DETAIL(item.type, item.id)} className="group flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-content-text group-hover:text-[var(--accent-gold)]">{item.name}</span>
                <span className="block text-xs text-content-muted">{item.type === "CONTEXT" ? "Bối cảnh" : "Nhân vật"}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      {items.length > latest.length && (
        <Link href={ROUTES.CLASS_MATERIALS} className="archive-link">
          Xem tất cả tư liệu ({items.length})
        </Link>
      )}
    </div>
  );
}

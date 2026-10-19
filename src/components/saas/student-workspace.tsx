"use client";

import Link from "next/link";
import { ChevronRight, LibraryBig } from "lucide-react";
import { DailyQuestsCard } from "@/components/home/daily-quests-card";
import { ApiClassroomSideCard, NoDataYet } from "@/components/saas/api-classroom-ui";
import { ROUTES } from "@/constants/routes";
import type { ApiClassroom } from "@/services/school.service";
import { useAuthStore } from "@/store/auth.store";

/**
 * Trang đầu "Không gian lớp học" của học sinh trường (/classes). The classes come from the classroom API;
 * assignments, class & school materials and grades have no API yet, so they show an honest empty state.
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
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-[var(--border-strong)] pb-4">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-content-muted first-letter:uppercase">{dateLabel}</p>
          <p className="text-[15px] leading-relaxed text-content-text">
            {greeting(now)}, <strong>{firstName}</strong>! Lớp {classes.map((c) => c.className).join(", ")}
            {schoolName && <> · {schoolName}</>}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <section aria-labelledby="ws-todo" className="space-y-3">
            <h2 id="ws-todo" className="archive-title is-plain text-xl">
              Bài cần làm
            </h2>
            <NoDataYet title="Chưa có bài tập" description="Bài tập thầy cô giao cho lớp sẽ hiện ở đây." />
          </section>

          <section aria-labelledby="ws-materials" className="space-y-3">
            <h2 id="ws-materials" className="archive-title is-plain text-xl">
              Kho tư liệu
            </h2>
            <NoDataYet title="Chưa có tư liệu" description="Tư liệu thầy cô và nhà trường xuất bản cho em sẽ hiện ở đây." />
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

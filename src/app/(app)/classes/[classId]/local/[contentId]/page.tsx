"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { NeutralBadge, Panel, SaasShell } from "@/components/saas/saas-ui";
import { StudentContextArticle } from "@/components/saas/student-context-article";
import { StudentMockChat } from "@/components/saas/student-mock-chat";
import { StudentQuizRunner } from "@/components/saas/student-quiz-runner";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { canSeeLocal } from "@/features/saas/hooks-student";
import { useMyClasses, useSaasStore } from "@/features/saas/store";
import type { LocalCharacter, LocalContent } from "@/features/saas/types";

const STATUS_LABEL: Record<LocalContent["status"], string> = {
  DRAFT: "Bản nháp",
  PENDING: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  INACTIVE: "Tạm ẩn",
  TRASH: "Thùng rác",
};

const LEVEL_LABEL = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" } as const;

/** Xem tư liệu lịch sử địa phương của lớp (Role Matrix row 14). Students: published only; teachers: any status. */
export default function ClassLocalContentPage() {
  const { classId, contentId } = useParams<{ classId: string; contentId: string }>();
  const role = useRole();
  return (
    <SaasShell variant="app" title="Tư liệu địa phương" description="Lịch sử quê hương do thầy cô biên soạn cho lớp.">
      <LocalContentView classId={classId} contentId={contentId} role={role} />
    </SaasShell>
  );
}

function LocalContentView({ classId, contentId, role }: { classId: string; contentId: string; role: string | null }) {
  const myClasses = useMyClasses(role);
  const item = useSaasStore((s) => s.localContent.find((x) => x.id === contentId));
  const classroom = myClasses.find((c) => c.id === classId);

  const back = (
    <Link href={classroom ? ROUTES.CLASS_DETAIL(classId) : ROUTES.CLASSES} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {classroom ? `Lớp ${classroom.name}` : "Lớp của tôi"}
    </Link>
  );

  if (!classroom || !item || !canSeeLocal(item, classId, role)) {
    return (
      <EmptyState
        title="Không xem được tư liệu này"
        description="Tư liệu không tồn tại, chưa được xuất bản hoặc không thuộc lớp của bạn."
        action={back}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        {role === "TEACHER" && item.status !== "PUBLISHED" && <NeutralBadge>{STATUS_LABEL[item.status]} · học sinh chưa thấy</NeutralBadge>}
      </div>

      {item.kind === "CONTEXT" && (
        <StudentContextArticle context={item} mapHref={`${ROUTES.HISTORICAL_MAP}?layer=class&classId=${classId}`} />
      )}

      {item.kind === "CHARACTER" && <CharacterView character={item} />}

      {item.kind === "QUIZ" && (
        <div className="space-y-3">
          <p className="text-[13px] text-content-muted">
            Mức độ {LEVEL_LABEL[item.level]} · Chế độ luyện tập: không tính điểm, làm lại bao nhiêu lần cũng được.
          </p>
          <StudentQuizRunner title={item.title} questions={item.questions} mode="practice" />
        </div>
      )}
    </div>
  );
}

function CharacterView({ character }: { character: LocalCharacter }) {
  const years =
    character.bornYear || character.deathYear ? `${character.bornYear ?? "?"} – ${character.deathYear ?? "?"}` : null;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel className="h-fit">
        <div className="flex items-center gap-4">
          {character.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- teacher-provided URL of any host
            <img src={character.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-[2px] border border-[var(--border-default)] object-cover" />
          ) : (
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[2px] bg-[var(--accent-gold)] text-white" aria-hidden="true">
              <UserRound className="h-9 w-9" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="archive-title is-plain text-2xl">{character.name}</h2>
            <p className="text-[13px] text-content-muted">{character.title}</p>
            {years && <p className="mt-1 font-display text-lg font-extrabold tabular-nums text-[var(--accent-gold)]">{years}</p>}
          </div>
        </div>
        <div className="space-y-1 border-t border-[var(--border-default)] pt-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-content-muted">Tiểu sử</p>
          <p className="text-[14px] leading-relaxed text-content-text">{character.biography}</p>
        </div>
        <div className="space-y-1 border-t border-[var(--border-default)] pt-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-content-muted">Phong cách trò chuyện</p>
          <p className="text-[13px] leading-relaxed text-content-muted">{character.persona}</p>
        </div>
      </Panel>
      <StudentMockChat character={character} />
    </div>
  );
}

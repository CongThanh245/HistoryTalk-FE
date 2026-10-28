"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowRight, CheckCircle2, Flame, MessagesSquare, Trophy } from "lucide-react";
import { ArchiveHeading } from "@/components/commons/archive-heading";
import { ROUTES } from "@/constants/routes";
import { useChatHistory } from "@/features/chat/hooks";
import { useMyDashboard } from "@/features/dashboard/hooks";
import { useGamificationToday } from "@/features/gamification/hooks";
import { useEntitlements } from "@/features/saas/entitlements";
import { isValidUrl } from "@/lib/utils/url";
import type { QuestType } from "@/services/gamification.service";
import { useAuthStore } from "@/store/auth.store";

// Below this many quizzes an average score says more about luck than progress, so we don't show it.
const MIN_QUIZZES_FOR_SCORE = 3;

const QUEST_ROUTE: Record<QuestType, string> = {
  CHAT: "/characters",
  QUIZ: "/quiz",
  READ_CONTEXT: "/events",
};

function TileSkeleton() {
  return <div className="h-[104px] rounded-sm border border-border-card bg-[var(--bg-surface)] animate-pulse" />;
}

/** One "pick up where you left off" tile: what it is, one line of status, one action. */
function Tile({
  icon,
  eyebrow,
  title,
  meta,
  href,
  cta,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  meta: string;
  href?: string;
  cta?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        {icon}
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-content-muted">{eyebrow}</p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-content-heading">{title}</p>
          <p className="truncate text-xs text-content-muted">{meta}</p>
        </div>
      </div>
      {href && cta && (
        <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--accent-gold)]">
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      )}
    </>
  );

  const className =
    "group flex min-w-0 flex-col justify-between rounded-sm border border-border-card bg-[var(--bg-surface)] p-4 transition-colors duration-150";

  return href ? (
    <Link href={href} className={`${className} hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm bg-[var(--accent-gold-active-bg)] text-[var(--accent-gold)]">
      {children}
    </span>
  );
}

export function LearningDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Gamification is customer-only — school accounts get a 403, so they don't get the quest tile.
  const isSchoolAccount = useEntitlements().mode === "B2B";
  const { data: dashboard, isLoading: dashboardLoading } = useMyDashboard();
  const { data: chatGroups = [], isLoading: chatLoading } = useChatHistory();
  const { data: today } = useGamificationToday({ enabled: !isSchoolAccount });

  const lastSession = useMemo(
    () =>
      chatGroups
        .flatMap((group) => group.sessions)
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0],
    [chatGroups],
  );

  if (!isAuthenticated) return null;

  if (dashboardLoading || chatLoading) {
    return (
      <section>
        <ArchiveHeading title="Tiếp tục hành trình" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {[0, 1, 2].map((i) => <TileSkeleton key={i} />)}
        </div>
      </section>
    );
  }

  const quizCount = dashboard?.learning.totalQuizzesAttempted ?? 0;

  // Brand-new users have nothing to continue yet: the banner above is their starting point.
  if (!lastSession && quizCount === 0) return null;

  const quests = Array.isArray(today?.quests) ? today.quests : [];
  const doneCount = quests.filter((q) => q.completed).length;
  const nextQuest = quests.find((q) => !q.completed);
  const showQuestTile = !isSchoolAccount && quests.length > 0;

  return (
    <section>
      <ArchiveHeading title="Tiếp tục hành trình" />

      <div className={`grid grid-cols-1 gap-3 md:gap-4 ${showQuestTile ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {lastSession ? (
          <Tile
            icon={
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-[var(--bg-deep)]">
                <Image
                  src={isValidUrl(lastSession.characterImage) ? lastSession.characterImage : "/card.jpg"}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover object-top"
                />
              </span>
            }
            eyebrow="Trò chuyện gần nhất"
            title={lastSession.characterName}
            meta={`${lastSession.messageCount} tin nhắn · ${lastSession.contextName}`}
            href={`/chat/${lastSession.characterId}?contextId=${lastSession.contextId}&sessionId=${lastSession.id}`}
            cta="Trò chuyện tiếp"
          />
        ) : (
          <Tile
            icon={<IconBadge><MessagesSquare className="h-5 w-5" aria-hidden="true" /></IconBadge>}
            eyebrow="Trò chuyện"
            title="Chưa có cuộc trò chuyện"
            meta="Gặp một nhân vật để bắt đầu"
            href="/characters"
            cta="Chọn nhân vật"
          />
        )}

        <Tile
          icon={<IconBadge><Trophy className="h-5 w-5" aria-hidden="true" /></IconBadge>}
          eyebrow="Câu đố"
          title={quizCount > 0 ? `${quizCount} bài đã làm` : "Chưa làm bài nào"}
          meta={
            quizCount >= MIN_QUIZZES_FOR_SCORE
              ? `Điểm trung bình ${dashboard?.learning.averageScorePercentage ?? 0}%`
              : "Làm thêm vài bài để xem tiến độ"
          }
          href={quizCount >= MIN_QUIZZES_FOR_SCORE ? ROUTES.GRADES : "/quiz"}
          cta={quizCount >= MIN_QUIZZES_FOR_SCORE ? "Xem tiến độ" : "Làm câu đố"}
        />

        {showQuestTile && (
          <Tile
            icon={
              <IconBadge>
                {nextQuest ? <Flame className="h-5 w-5" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
              </IconBadge>
            }
            eyebrow={`Nhiệm vụ hôm nay · ${doneCount}/${quests.length}`}
            title={nextQuest ? nextQuest.title : "Đã hoàn thành hết"}
            meta={
              nextQuest
                ? `${nextQuest.progress}/${nextQuest.target} · chuỗi ${today?.streakCount ?? 0} ngày`
                : `Chuỗi ${today?.streakCount ?? 0} ngày · nhận thưởng ở biểu tượng 🔥`
            }
            href={nextQuest ? QUEST_ROUTE[nextQuest.type] : undefined}
            cta={nextQuest ? "Làm ngay" : undefined}
          />
        )}
      </div>
    </section>
  );
}

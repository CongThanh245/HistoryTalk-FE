"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { LocalItemPreview, LocalScopeTag, QueryState } from "@/components/saas/local-content-ui";
import { NeutralBadge, Panel, SaasShell } from "@/components/saas/saas-ui";
import { StudentMockChat } from "@/components/saas/student-mock-chat";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useLocalItem, useStudentLocalContent } from "@/features/saas/hooks-local-content";
import type { LocalItem, LocalKind } from "@/services/local-content.service";

/** Đọc bối cảnh / nhân vật địa phương đã duyệt (Sprint 6 API). Students only see published items of their school. */
export default function LocalMaterialPage() {
  const { kind: rawKind, id } = useParams<{ kind: string; id: string }>();
  const kind: LocalKind | null = rawKind === "context" ? "CONTEXT" : rawKind === "character" ? "CHARACTER" : null;
  const role = useRole();
  return (
    <SaasShell variant="app" live title="Tư liệu lớp & trường" description="Tư liệu do thầy cô hoặc nhà trường biên soạn, tách biệt với nội dung chính thức của HistoryTalk.">
      {!kind ? (
        <NotFound />
      ) : role === "SCHOOL_STUDENT" ? (
        <StudentView kind={kind} id={id} />
      ) : role === "TEACHER" ? (
        <TeacherView kind={kind} id={id} />
      ) : (
        <EmptyState title="Không có tư liệu lớp" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." />
      )}
    </SaasShell>
  );
}

const back = (
  <Link href={ROUTES.CLASS_MATERIALS} className="archive-link">
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tư liệu lớp &amp; trường
  </Link>
);

function NotFound() {
  return <EmptyState title="Không xem được tư liệu này" description="Tư liệu không tồn tại, chưa được duyệt hoặc không thuộc trường của bạn." action={back} />;
}

/** The student API has no detail endpoint: the item is taken from the published list. */
function StudentView({ kind, id }: { kind: LocalKind; id: string }) {
  const { items, isLoading, isError, error, refetch } = useStudentLocalContent();
  const item = items.find((i) => i.type === kind && i.id === id);
  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      {item ? <MaterialView item={item} /> : <NotFound />}
    </QueryState>
  );
}

function TeacherView({ kind, id }: { kind: LocalKind; id: string }) {
  const query = useLocalItem(kind, id);
  if (query.isError) return <NotFound />;
  return (
    <QueryState isLoading={query.isLoading} isError={false} error={null} onRetry={query.refetch}>
      {query.data && <MaterialView item={query.data} teacher />}
    </QueryState>
  );
}

function MaterialView({ item, teacher }: { item: LocalItem; teacher?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <span className="flex flex-wrap items-center gap-2">
          <LocalScopeTag item={item} />
          {teacher && !item.isPublished && <NeutralBadge>Chưa duyệt · học sinh chưa thấy</NeutralBadge>}
        </span>
      </div>

      {item.type === "CONTEXT" ? (
        <Panel>
          <h2 className="archive-title is-plain text-3xl">{item.name}</h2>
          <LocalItemPreview item={item} />
        </Panel>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Panel className="h-fit">
            <div className="flex items-center gap-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[2px] bg-[var(--accent-gold)] text-white" aria-hidden="true">
                <UserRound className="h-9 w-9" />
              </span>
              <div className="min-w-0">
                <h2 className="archive-title is-plain text-2xl">{item.name}</h2>
                {item.title && <p className="text-[13px] text-content-muted">{item.title}</p>}
              </div>
            </div>
            <LocalItemPreview item={{ ...item, title: null }} />
          </Panel>
          {/* Mock until the AI chat supports local characters. */}
          <StudentMockChat
            character={{
              name: item.name,
              title: item.title ?? "",
              biography: item.description,
              persona: item.personality ?? undefined,
              imageUrl: item.imageUrl ?? undefined,
            }}
          />
        </div>
      )}
    </div>
  );
}

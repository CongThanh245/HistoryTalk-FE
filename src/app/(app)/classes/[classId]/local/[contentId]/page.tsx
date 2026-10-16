"use client";

// Bối cảnh & nhân vật địa phương: API Sprint 6. BE không gắn tư liệu với lớp, nên classId chỉ dùng cho nút quay lại.
import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, UserRound } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { LocalItemPreview, LocalScopeTag, QueryState } from "@/components/saas/local-content-ui";
import { NeutralBadge, Panel, SaasShell, SectionHeading, formatDate } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useLocalDocuments, useLocalItem, useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import type { LocalItem, LocalKind } from "@/services/local-content.service";

/** Xem tư liệu lịch sử địa phương (Role Matrix row 14). Students: published items of their school; teachers: any they can read. */
export default function ClassLocalContentPage() {
  return (
    <SaasShell variant="app" live title="Tư liệu lớp & trường" description="Tư liệu do thầy cô hoặc nhà trường biên soạn, tách biệt với nội dung chính thức của HistoryTalk.">
      <React.Suspense fallback={null}>
        <LocalContentRoute />
      </React.Suspense>
    </SaasShell>
  );
}

function LocalContentRoute() {
  const { classId, contentId } = useParams<{ classId: string; contentId: string }>();
  const raw = useSearchParams().get("kind");
  const kind: LocalKind | null = raw === "CONTEXT" || raw === "CHARACTER" ? raw : null;
  const role = useRole();
  const back = (
    <Link href={ROUTES.CLASS_DETAIL(classId)} className="archive-link">
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Về lớp học
    </Link>
  );

  if (role === "SCHOOL_STUDENT") return <StudentView kind={kind} id={contentId} back={back} />;
  if (role === "TEACHER") {
    return kind ? <TeacherItemView kind={kind} id={contentId} back={back} /> : <TeacherListView id={contentId} back={back} />;
  }
  return <EmptyState title="Không có tư liệu lớp" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." action={back} />;
}

function NotFound({ back }: { back: React.ReactNode }) {
  return <EmptyState title="Không xem được tư liệu này" description="Tư liệu không tồn tại, chưa được duyệt hoặc không thuộc trường của bạn." action={back} />;
}

/** The student API has no detail endpoint: the item is taken from the published list. */
function StudentView({ kind, id, back }: { kind: LocalKind | null; id: string; back: React.ReactNode }) {
  const { items, isLoading, isError, error, refetch } = useStudentLocalContent();
  const item = items.find((i) => i.id === id && (!kind || i.type === kind));
  return (
    <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
      {item ? <ItemView item={item} back={back} /> : <NotFound back={back} />}
    </QueryState>
  );
}

function TeacherItemView({ kind, id, back }: { kind: LocalKind; id: string; back: React.ReactNode }) {
  const query = useLocalItem(kind, id);
  if (query.isError) return <NotFound back={back} />;
  return (
    <QueryState isLoading={query.isLoading} isError={false} error={null} onRetry={query.refetch}>
      {query.data && <ItemView item={query.data} back={back} teacher />}
    </QueryState>
  );
}

/** Link without ?kind=: look the id up in the teacher's lists. */
function TeacherListView({ id, back }: { id: string; back: React.ReactNode }) {
  const api = useTeacherLocalContent();
  const item = [...api.contexts, ...api.characters].find((i) => i.id === id);
  return (
    <QueryState isLoading={api.isLoading} isError={api.isError} error={api.error} onRetry={api.refetch}>
      {item ? <ItemView item={item} back={back} teacher /> : <NotFound back={back} />}
    </QueryState>
  );
}

function ItemView({ item, back, teacher }: { item: LocalItem; back: React.ReactNode; teacher?: boolean }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <span className="flex flex-wrap items-center gap-2">
          <LocalScopeTag item={item} />
          {teacher && !item.isPublished && <NeutralBadge>Chưa duyệt · học sinh chưa thấy</NeutralBadge>}
        </span>
      </div>

      <Panel>
        {item.type === "CONTEXT" ? (
          <h2 className="archive-title is-plain text-3xl">{item.name}</h2>
        ) : (
          <div className="flex items-center gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-[2px] bg-[var(--accent-gold)] text-white" aria-hidden="true">
              <UserRound className="h-9 w-9" />
            </span>
            <div className="min-w-0">
              <h2 className="archive-title is-plain text-2xl">{item.name}</h2>
              {item.title && <p className="text-[13px] text-content-muted">{item.title}</p>}
            </div>
          </div>
        )}
        <LocalItemPreview item={item.type === "CHARACTER" ? { ...item, title: null } : item} />
        <p className="text-xs text-content-muted">
          {item.createdBy ? `${item.createdBy.fullName} · ` : ""}Cập nhật {formatDate(item.updatedAt)}
        </p>
      </Panel>

      {/* Documents are only exposed by the teacher API. */}
      {teacher && <Documents kind={item.type} id={item.id} />}
    </div>
  );
}

function Documents({ kind, id }: { kind: LocalKind; id: string }) {
  const query = useLocalDocuments(kind, id);
  const docs = query.data ?? [];
  return (
    <Panel>
      <SectionHeading title="Tài liệu tham khảo" description="Tài liệu đính kèm để AI dựa vào khi trả lời." />
      <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={query.refetch}>
        {docs.length === 0 ? (
          <p className="text-sm text-content-muted">Chưa có tài liệu nào.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-default)]">
            {docs.map((d) => (
              <li key={d.docId} className="flex items-start gap-3 py-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-content-heading">{d.title}</p>
                  <p className="line-clamp-3 whitespace-pre-line text-sm text-content-muted">{d.content}</p>
                  {d.fileUrl && (
                    <a href={d.fileUrl} target="_blank" rel="noreferrer" className="archive-link break-all text-xs">
                      {d.fileUrl}
                    </a>
                  )}
                  <p className="text-xs text-content-muted">
                    {d.userName ?? "Giáo viên"} · {formatDate(d.uploadDate)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </Panel>
  );
}

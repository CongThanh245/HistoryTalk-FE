"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageCircle, UserRound } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { LocalItemPreview, LocalScopeTag, QueryState } from "@/components/saas/local-content-ui";
import { NeutralBadge, Panel, SaasShell } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useLocalItem, useStudentLocalItem } from "@/features/saas/hooks-local-content";
import type { LocalItem, LocalKind } from "@/services/local-content.service";

/** Đọc bối cảnh / nhân vật giáo viên soạn đã xuất bản (Sprint 6 API). Students only see published items of their school. */
export default function LocalMaterialPage() {
  const { kind: rawKind, id } = useParams<{ kind: string; id: string }>();
  const kind: LocalKind | null = rawKind === "context" ? "CONTEXT" : rawKind === "character" ? "CHARACTER" : null;
  const role = useRole();
  return (
    <SaasShell variant="app" live title="Kho tư liệu" description="Tư liệu do thầy cô hoặc nhà trường biên soạn, tách biệt với thư viện HistoryTalk.">
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
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Kho tư liệu
  </Link>
);

function NotFound() {
  return <EmptyState title="Không xem được tư liệu này" description="Tư liệu không tồn tại, chưa được xuất bản hoặc không thuộc trường của bạn." action={back} />;
}

function StudentView({ kind, id }: { kind: LocalKind; id: string }) {
  const query = useStudentLocalItem(kind, id);
  if (query.isError) return <NotFound />;
  return (
    <QueryState isLoading={query.isLoading} isError={false} error={null} onRetry={query.refetch}>
      {query.data && <MaterialView item={query.data} />}
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
          {/* "Riêng tôi" la goc nhin cua GV; hoc sinh thay "Của lớp" / "Của trường" nhu trang danh sach. */}
          {teacher ? <LocalScopeTag item={item} /> : <ContentSourceTag source={item.contentScope === "SCHOOL_WIDE" ? "SCHOOL" : "CLASS"} />}
          {teacher && !item.isPublished && <NeutralBadge>Chưa xuất bản · học sinh chưa thấy</NeutralBadge>}
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
          <Panel className="flex h-fit flex-col items-start gap-3">
            <MessageCircle className="h-7 w-7 text-[var(--accent-gold)]" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="text-[16px] font-bold text-content-heading">Trò chuyện với {item.name}</h3>
              <p className="text-[13px] leading-relaxed text-content-muted">
                {teacher && !item.isPublished
                  ? "Nhân vật chưa xuất bản nên chưa trò chuyện được. Xuất bản để thử trò chuyện và giao bài cho lớp."
                  : "Hỏi nhân vật về cuộc đời và sự kiện lịch sử. AI nhập vai, nên đối chiếu với tư liệu chính thống."}
              </p>
            </div>
            {(!teacher || item.isPublished) && (
              <Link href={ROUTES.CHAT(item.id)} className="btn-crimson">
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Bắt đầu trò chuyện
              </Link>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}

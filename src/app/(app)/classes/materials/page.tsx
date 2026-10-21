"use client";

// Bối cảnh & nhân vật: API Sprint 6 (đã xuất bản). BE chưa có API câu đố do giáo viên soạn.
import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, FilePenLine, Map as MapIcon, SearchX } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { QueryState } from "@/components/saas/local-content-ui";
import { KIND_LABEL, MaterialCard, useAssignmentTasks } from "@/components/saas/class-material-card";
import { SaasShell, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import { SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import type { LocalItem, LocalKind } from "@/services/local-content.service";


/** Kho tư liệu: everything the class's teachers prepared, kept apart from the official HistoryTalk library. */
export default function ClassMaterialsPage() {
  const role = useRole();
  return (
    <SaasShell
      variant="app"
      live
      title="Kho tư liệu"
      description={
        role === "TEACHER"
          ? "Bối cảnh và nhân vật học sinh của bạn đang thấy. Soạn và chỉnh sửa ở mục Quản lý tư liệu."
          : "Bài đọc và nhân vật lịch sử thầy cô chuẩn bị cho bạn."
      }
    >
      <Materials />
    </SaasShell>
  );
}

function Materials() {
  const role = useRole();
  const isTeacher = role === "TEACHER";
  const isStudent = role === "SCHOOL_STUDENT";
  const teacher = useTeacherLocalContent(isTeacher);
  const student = useStudentLocalContent(isStudent);
  const [kind, setKind] = React.useState<LocalKind | "ALL">("ALL");
  const [search, setSearch] = React.useState("");

  const tasks = useAssignmentTasks(isStudent);

  if (!isTeacher && !isStudent) {
    return <EmptyState title="Không có tư liệu lớp" description="Mục này dành cho tài khoản giáo viên và học sinh của trường." />;
  }

  const query = isTeacher ? teacher : student;
  // Teachers also see their own drafts in "Quản lý tư liệu"; here only what students can see.
  const all = (isTeacher ? [...teacher.contexts, ...teacher.characters] : student.items)
    .filter((i) => i.isPublished)
    .sort((a, b) => {
      const ta = tasks.get(a.id);
      const tb = tasks.get(b.id);
      const pa = ta && !ta.done ? 1 : 0;
      const pb = tb && !tb.done ? 1 : 0;
      return pb - pa || b.updatedAt.localeCompare(a.updatedAt);
    });

  const q = normalizeText(search);
  const filtering = Boolean(q) || kind !== "ALL";
  const shown = all.filter((i) => (kind === "ALL" || i.type === kind) && (!q || normalizeText(i.name).includes(q)));
  const pending = all.filter((i) => tasks.get(i.id) && !tasks.get(i.id)!.done).length;

  const manageLink = isTeacher && (
    <Link href={ROUTES.TEACHING.LOCAL} className="btn-ink">
      <FilePenLine className="h-4 w-4" aria-hidden="true" /> {all.length === 0 ? "Soạn tư liệu" : "Quản lý tư liệu"}
    </Link>
  );

  return (
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={query.refetch}>
      {all.length === 0 ? (
        <EmptyState
          size="lg"
          icon={BookOpen}
          title="Kho tư liệu đang trống"
          description={
            isTeacher
              ? "Tư liệu bạn soạn và xuất bản sẽ hiện ở đây cho học sinh. Trong lúc đó, lớp vẫn dùng được thư viện HistoryTalk."
              : "Thầy cô chưa đăng tư liệu nào. Trong lúc chờ, bạn có thể khám phá thư viện HistoryTalk."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {manageLink}
              <Link href={ROUTES.EVENTS} className="btn-line">
                Sự kiện
              </Link>
              <Link href={ROUTES.CHARACTERS} className="btn-line">
                Nhân vật
              </Link>
              <Link href={ROUTES.QUIZ} className="btn-line">
                Câu đố
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SegmentedFilter
              label="Loại tư liệu"
              value={kind}
              onChange={setKind}
              options={[
                { value: "ALL" as const, label: "Tất cả", count: all.length },
                ...(Object.keys(KIND_LABEL) as LocalKind[]).map((k) => ({
                  value: k,
                  label: KIND_LABEL[k],
                  count: all.filter((i) => i.type === k).length,
                })),
              ]}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
              <Link href={ROUTES.CLASS_MAP} className="btn-line">
                <MapIcon className="h-4 w-4" aria-hidden="true" /> Xem trên bản đồ
              </Link>
              {manageLink}
            </div>
          </div>

          {pending > 0 && !filtering && (
            <p className="flex items-center gap-2 text-sm text-content-text">
              <ClipboardList className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden="true" />
              Bạn có <b>{pending}</b> tư liệu cần đọc hoặc trò chuyện để nộp bài. Chúng được xếp lên đầu.
            </p>
          )}

          {filtering && shown.length === 0 ? (
            <EmptyState
              size="sm"
              icon={SearchX}
              title="Không tìm thấy tư liệu"
              description="Thử từ khoá khác hoặc chọn lại loại tư liệu."
              action={
                <button
                  type="button"
                  className="btn-line"
                  onClick={() => {
                    setSearch("");
                    setKind("ALL");
                  }}
                >
                  Xoá bộ lọc
                </button>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <MaterialCard item={item} task={tasks.get(item.id)} teacher={isTeacher} />
                </li>
              ))}
            </ul>
          )}

          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-sm text-content-muted">
            <span>Muốn tìm hiểu thêm? Thư viện HistoryTalk có sẵn:</span>
            <Link href={ROUTES.EVENTS} className="archive-link">
              Sự kiện <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link href={ROUTES.CHARACTERS} className="archive-link">
              Nhân vật <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link href={ROUTES.QUIZ} className="archive-link">
              Câu đố <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </p>
        </div>
      )}
    </QueryState>
  );
}

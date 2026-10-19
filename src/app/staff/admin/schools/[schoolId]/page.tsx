"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Building2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolAdminsTab } from "@/components/saas/admin-school-admins";
import { ErrorRetry, SchoolStatusPill } from "@/components/saas/admin-school-shared";
import { SchoolInfoTab } from "@/components/saas/admin-school-tabs";
import { SaasShell } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";
import { apiErrorMessage, apiErrorStatus, useApiSchool } from "@/features/saas/hooks-api";
import { PACKAGE_SHORT_LABELS, SCHOOL_STATUS_LABELS, millionTokens, useSchoolAdminCounts } from "@/features/saas/admin-schools";
import { ENTERPRISE_PACKAGE_TOKENS } from "@/services/school.service";

/** System Admin: one school (`GET /admin/schools/{id}`): info + token pool, and its School Admin accounts. */
export default function AdminSchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  // Same query as SchoolDetail (React Query dedupes it); the school name becomes the page title.
  const { data: school } = useApiSchool(schoolId);
  return (
    <SaasShell live title={school?.name ?? "Chi tiết trường"} backLink={<BackLink />} fallback={<DetailSkeleton />}>
      <SchoolDetail schoolId={schoolId} />
    </SaasShell>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Đang tải dữ liệu">
      <Skeleton className="h-6 w-80 max-w-full" />
      <Skeleton className="h-10 w-full max-w-xs" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-56 w-full" />
      <span className="sr-only">Đang tải dữ liệu...</span>
    </div>
  );
}

const BackLink = ({ label = "Tất cả trường" }: { label?: string }) => (
  <Link href={ROUTES.STAFF.ADMIN.SCHOOLS} className="archive-link">
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {label}
  </Link>
);

type TabId = "info" | "admins";

function SchoolDetail({ schoolId }: { schoolId: string }) {
  const { data: school, isLoading, isError, error, refetch, isFetching } = useApiSchool(schoolId);
  // `totalElements` of the unfiltered list (all pages), shared with the tab's own queries.
  const { total: adminCount } = useSchoolAdminCounts(schoolId);
  const [tab, setTab] = React.useState<TabId>("info");

  if (isLoading) return <DetailSkeleton />;

  if (isError || !school) {
    const status = apiErrorStatus(error);
    if (status === 404 || status === 400 || (!isError && !school)) {
      return (
        <EmptyState
          icon={Building2}
          title="Không tìm thấy trường"
          description="Trường có thể đã bị xóa hoặc đường dẫn không đúng."
          action={<BackLink label="Về danh sách trường" />}
        />
      );
    }
    return (
      <div className="space-y-6">
        <ErrorRetry
          title="Không tải được thông tin trường"
          message={apiErrorMessage(error, "Máy chủ không phản hồi. Kiểm tra kết nối rồi thử lại.")}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SchoolSummary school={school} />

      {school.status !== "ACTIVE" && (
        <p
          role="note"
          className="flex items-start gap-2 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
          <span>
            Trường đang ở trạng thái <b className="text-content-heading">{SCHOOL_STATUS_LABELS[school.status]}</b>.{" "}
            {school.status === "EXPIRED"
              ? "Gói năm học đã hết hạn: toàn bộ tài khoản của trường bị khóa cho tới khi gia hạn và kích hoạt năm học mới."
              : "Tài khoản của trường có thể không dùng được dịch vụ."}
          </span>
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="gap-5">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-10 w-max justify-start">
            <TabsTrigger value="info" className="flex-none px-4">
              Thông tin
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex-none px-4">
              Quản trị trường{adminCount !== undefined ? ` (${adminCount})` : ""}
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="info">
          <SchoolInfoTab school={school} />
        </TabsContent>
        <TabsContent value="admins">
          <SchoolAdminsTab school={school} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const SUMMARY_LABEL = "text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]";

/** Key facts of the school as a labelled strip: code, package, school-year pool, status. */
function SchoolSummary({ school }: { school: NonNullable<ReturnType<typeof useApiSchool>["data"]> }) {
  const tokens = ENTERPRISE_PACKAGE_TOKENS[school.packageType];
  const items: { label: string; value: React.ReactNode }[] = [
    { label: "Mã trường", value: <span className="font-mono">{school.schoolCode}</span> },
    { label: "Gói dịch vụ", value: PACKAGE_SHORT_LABELS[school.packageType] ?? school.packageType },
    { label: "Token mỗi năm học", value: tokens ? `${millionTokens(tokens)} token` : "—" },
    { label: "Trạng thái", value: <SchoolStatusPill status={school.status} /> },
  ];
  return (
    <dl className="grid grid-cols-2 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] lg:grid-cols-4">
      {items.map(({ label, value }, i) => (
        <div
          key={label}
          className={cn(
            "space-y-1 px-4 py-3",
            i % 2 === 1 && "border-l border-[var(--border-default)]",
            i >= 2 && "border-t border-[var(--border-default)] lg:border-t-0",
            i === 2 && "lg:border-l",
          )}
        >
          <dt className={SUMMARY_LABEL}>{label}</dt>
          <dd className="text-sm font-bold text-content-heading">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

"use client";

import { ArchiveHeading } from "@/components/commons/archive-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell, useHydrated } from "@/components/saas/saas-ui";
import { CustomerGrades } from "@/components/saas/student-customer-grades";
import { StudentGradeBook } from "@/components/saas/student-grade-book";
import { useRole } from "@/features/auth/usePermission";

const TITLE = "Bảng điểm & tiến độ học tập";

/**
 * Role Matrix row 25. School students: grade book per class from the (mock) classroom store.
 * Customers: real learning stats from the API, so no mock-data notice.
 */
export default function GradesPage() {
  const role = useRole();
  // The auth store is restored from storage on the client; wait for it so server and client agree.
  const hydrated = useHydrated();

  if (hydrated && role === "SCHOOL_STUDENT") {
    return (
      <SaasShell variant="app" title={TITLE} description="Điểm bài kiểm tra, mức độ hoàn thành bài tập và hoạt động học với AI của em.">
        <StudentGradeBook role={role} />
      </SaasShell>
    );
  }

  return (
    <div className="space-y-6 py-6 text-content-text">
      <ArchiveHeading as="h1" title={TITLE} description="Điểm quiz, thời kỳ bạn đã học và mức dùng token." className="mb-0" />
      {!hydrated ? null : role === "CUSTOMER" ? (
        <CustomerGrades />
      ) : role ? (
        <EmptyState title="Không có bảng điểm" description="Bảng điểm dành cho học viên và học sinh." />
      ) : null}
    </div>
  );
}

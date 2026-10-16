"use client";

import { OverviewWidgets } from "./_components/overview";
import { SchoolShell } from "./_components/shared";

/** School Admin dashboard: school, token pool, class / teacher / student counts (all from the API). */
export default function SchoolOverviewPage() {
  return (
    <SchoolShell title="Tổng quan trường" description="Thông tin trường, quỹ token theo gói, số lớp, giáo viên và học sinh.">
      <OverviewWidgets />
    </SchoolShell>
  );
}

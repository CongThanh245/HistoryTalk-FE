"use client";

import { OverviewWidgets } from "./_components/overview";
import { SchoolShell } from "./_components/shared";

/** School Admin dashboard: school, token pool, class / teacher / student counts (all from the API). */
export default function SchoolOverviewPage() {
  return (
    <SchoolShell title="Tổng quan trường" description="Quỹ token, người dùng, nội dung, chat và quiz của trường.">
      <OverviewWidgets />
    </SchoolShell>
  );
}

"use client"

// components/layout/customer-sidebar.tsx
import { CUSTOMER_SIDEBAR, SCHOOL_STUDENT_SIDEBAR, TEACHER_SIDEBAR } from "@/routers/sidebar";
import { useRole } from "@/features/auth/usePermission";
import { useEntitlements } from "@/features/saas/entitlements";
import Sidebar from "./sidebar";

export default function CustomerSidebar() {
  const role = useRole() ?? undefined;
  const { mode, schoolName } = useEntitlements();
  const roleSections =
    role === "TEACHER" ? TEACHER_SIDEBAR
      : role === "SCHOOL_STUDENT" ? SCHOOL_STUDENT_SIDEBAR
        : CUSTOMER_SIDEBAR;
  // The class workspace is named after the school, next to the "HistoryTalk" section.
  const sections = schoolName
    ? roleSections.map((s) => (s.schoolOwned ? { ...s, title: schoolName } : s))
    : roleSections;

  // Customers see their wallet + upgrade card; school accounts see today's school quota instead
  // (no upgrade, Role Matrix row 26). The footer picks the right card from useEntitlements().
  return <Sidebar sections={sections} showUpgrade={mode !== "STAFF"} logoHref={role === "TEACHER" ? "/teaching" : role === "SCHOOL_STUDENT" ? "/classes" : "/"} />;
}

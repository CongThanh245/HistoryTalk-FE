"use client"

// components/layout/customer-sidebar.tsx
import { CUSTOMER_SIDEBAR, SCHOOL_STUDENT_SIDEBAR, TEACHER_SIDEBAR } from "@/routers/sidebar";
import { useRole } from "@/features/auth/usePermission";
import { useEntitlements } from "@/features/saas/entitlements";
import Sidebar from "./sidebar";

export default function CustomerSidebar() {
  const role = useRole() ?? undefined;
  const { mode } = useEntitlements();
  const sections =
    role === "TEACHER" ? TEACHER_SIDEBAR
      : role === "SCHOOL_STUDENT" ? SCHOOL_STUDENT_SIDEBAR
        : CUSTOMER_SIDEBAR;

  // Customers see their wallet + upgrade card; school accounts see today's school quota instead
  // (no upgrade, Role Matrix row 26). The footer picks the right card from useEntitlements().
  return <Sidebar sections={sections} showUpgrade={mode !== "STAFF"} logoHref={role === "TEACHER" ? "/teaching" : "/"} />;
}

"use client";
// components/layout/staff-sidebar.tsx
import { usePathname } from "next/navigation";
import { STAFF_SIDEBAR, SYSTEM_ADMIN_SIDEBAR } from "@/routers/sidebar";
import Sidebar from "./sidebar";

export default function StaffSidebar() {
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith("/staff/admin");

  return (
    <Sidebar
      sections={isAdminPath ? SYSTEM_ADMIN_SIDEBAR : STAFF_SIDEBAR}
      showUpgrade={false}
      logoHref={isAdminPath ? "/staff/admin" : "/staff"}
    />
  );
}
"use client"
// components/layout/staff-sidebar.tsx
import { STAFF_SIDEBAR } from "@/routers/sidebar";
import Sidebar from "./sidebar";

export default function StaffSidebar() {
  return <Sidebar sections={STAFF_SIDEBAR} showUpgrade={false} logoHref="/staff" />;
}
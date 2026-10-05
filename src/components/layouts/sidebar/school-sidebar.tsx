"use client";

import { SCHOOL_ADMIN_SIDEBAR } from "@/routers/sidebar";
import Sidebar from "./sidebar";

export default function SchoolSidebar() {
  return <Sidebar sections={SCHOOL_ADMIN_SIDEBAR} showUpgrade={false} logoHref="/school" />;
}

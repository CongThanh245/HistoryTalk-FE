"use client"

// components/layout/customer-sidebar.tsx
import { CUSTOMER_SIDEBAR } from "@/routers/sidebar";
import Sidebar from "./sidebar";
import { usePathname } from "next/navigation";

export default function CustomerSidebar() {
  const pathname = usePathname();

  // Chat pages have their own in-chat navigation (sessions/character drawer).
  if (pathname?.startsWith("/chat")) return null;
  return <Sidebar sections={CUSTOMER_SIDEBAR} />;
}

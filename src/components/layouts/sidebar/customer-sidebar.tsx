"use client"

// components/layout/customer-sidebar.tsx
import { CUSTOMER_SIDEBAR } from "@/routers/sidebar";
import Sidebar from "./sidebar";

export default function CustomerSidebar() {
  return <Sidebar sections={CUSTOMER_SIDEBAR} />;
}

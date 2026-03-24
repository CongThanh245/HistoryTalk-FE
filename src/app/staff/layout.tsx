import Header from "@/components/layouts/header";
import ReactQueryProviders from "@/components/context/query-client-provider";
import React from "react";
import StaffSidebar from "@/components/layouts/sidebar/staff-sidebar";
import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";

import Breadcrumbs from "@/components/commons/breadcrumbs";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProviders>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50/50">
          <StaffSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <Breadcrumbs />
            <main
              className="flex-1 overflow-y-auto"
              style={{ background: "var(--bg-content)" }}
            >
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ReactQueryProviders>
  );
}

export default layout;

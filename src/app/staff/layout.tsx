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
        <div className="flex h-[100dvh] bg-[var(--bg-content)]">
          <StaffSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <Breadcrumbs />
            <main
              className="flex-1 overflow-y-auto staff-theme"
              style={{ background: "var(--bg-content-decorated)" }}
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

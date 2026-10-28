import { privateMetadata } from "@/lib/seo";
export const metadata = privateMetadata;
import Header from "@/components/layouts/header";
import ReactQueryProviders from "@/components/context/query-client-provider";
import React from "react";
import StaffSidebar from "@/components/layouts/sidebar/staff-sidebar";
import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";
function layout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProviders>
      <SidebarProvider>
        <div className="flex h-[100dvh] bg-[var(--bg-content)]">
          <StaffSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            {/* Plain work surface: the drum backdrop is for the learner side, not admin tools. */}
            <main className="relative flex-1 min-h-0 overflow-y-auto staff-theme bg-[var(--bg-content)]">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ReactQueryProviders>
  );
}

export default layout;

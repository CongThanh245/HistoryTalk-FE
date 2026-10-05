import { privateMetadata } from "@/lib/seo";
export const metadata = privateMetadata;
import Header from "@/components/layouts/header";
import ReactQueryProviders from "@/components/context/query-client-provider";
import React from "react";
import SchoolSidebar from "@/components/layouts/sidebar/school-sidebar";
import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";
import Breadcrumbs from "@/components/commons/breadcrumbs";

/** School Admin workspace (gói trường học). Access is enforced by the auth middleware. */
export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProviders>
      <SidebarProvider>
        <div className="flex h-[100dvh] bg-[var(--bg-content)]">
          <SchoolSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <Breadcrumbs />
            <main
              className="relative flex-1 min-h-0 overflow-y-auto staff-theme"
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

import Header from "@/components/layouts/header";
import ReactQueryProviders from "@/components/context/query-client-provider";
import React, { Suspense } from "react";
import CustomerSidebar from "@/components/layouts/sidebar/customer-sidebar";
import { SidebarProvider } from "@/components/layouts/sidebar/sidebar-context";
import { CustomerRouteGuard } from "@/components/context/customer-route-guard";
import Breadcrumbs from "@/components/commons/breadcrumbs";
import { GoogleWelcomeNotifier } from "@/components/commons/google-welcome-notifier";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProviders>
      <CustomerRouteGuard>
        <SidebarProvider>
          {/* On mobile: sidebar is a fixed overlay, main takes full width.   */}
          {/* On md+:    sidebar sits in the flex row beside the main content. */}
          <div className="flex h-[100dvh]" style={{ background: "var(--bg-content)" }}>
            <CustomerSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <Breadcrumbs />
              <main
                className="flex-1 min-h-0 overflow-y-auto"
                style={{ background: "var(--bg-content-decorated)" }}
              >
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </CustomerRouteGuard>
      {/* Fires a toast if the URL contains ?notify=google_welcome */}
      <Suspense>
        <GoogleWelcomeNotifier />
      </Suspense>
    </ReactQueryProviders>
  );
}

export default layout;

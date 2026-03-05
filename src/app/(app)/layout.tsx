import Header from "@/components/layouts/header";
import Sidebar from "@/components/layouts/sidebar";
import ReactQueryProviders from "@/components/context/query-client-provider";
import React from "react";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProviders>
      <div className="flex h-screen bg-gray-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main
            className="flex-1 overflow-hidden"
            style={{ background: "var(--bg-content)" }}
          >
            {/* Xoá div container này */}
            {children}
          </main>
        </div>
      </div>
    </ReactQueryProviders>
  );
}

export default layout;

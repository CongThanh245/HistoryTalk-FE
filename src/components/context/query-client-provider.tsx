// components/context/query-client-provider.tsx
"use client";

import { getQueryClient } from "@/lib/get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import type * as React from "react";

export default function ReactQueryProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Không dùng useState — getQueryClient() tự xử lý singleton trên browser
  // và tạo mới mỗi request trên server
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

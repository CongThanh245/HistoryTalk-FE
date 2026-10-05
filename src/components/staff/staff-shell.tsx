"use client";

import * as React from "react";
import { ArchiveHeading } from "@/components/commons/archive-heading";

export function StaffShell({
  title,
  description,
  label = "Quản trị",
  children,
}: {
  title: string;
  description: string;
  /** Short bracketed index label shown above the title, e.g. "Nội dung". */
  label?: string;
  /** Kept for API compatibility; the archive heading no longer renders an icon tile. */
  icon?: React.ComponentType<any>;
  /** Kept for API compatibility; the archive heading uses the ink/crimson palette. */
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    // px-6 (mobile) và lg:px-10 (màn hình lớn) để tạo khoảng cách với sidebar và mép phải.
    <div className="space-y-6 pb-6 px-6 lg:px-10 max-w-[1600px] text-content-text">
      {/* Padding vừa phải để trang fit trong 1 màn hình, không cần cuộn thêm */}
      <div className="pt-4">
        <ArchiveHeading as="h1" label={label} title={title} description={description} className="mb-0" />
      </div>

      {/* Phần children bây giờ sẽ tự động thụt vào theo padding của cha */}
      <div className="w-full">{children}</div>
    </div>
  );
}

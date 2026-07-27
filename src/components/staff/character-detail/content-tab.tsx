"use client";

import * as React from "react";
import {
  StaffFormLabel,
  StaffFormTextarea,
} from "@/components/staff/staff-form";
import { TabsContent } from "@/components/ui/tabs";
import type { ContentTabProps } from "./types";

function ValidationErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="text-[11px] font-medium text-accent-danger">
      {message}
    </p>
  ) : null;
}

export function ContentTab({ draft, set, isEditing, errors }: ContentTabProps) {
  return (
    <TabsContent value="content" className="space-y-5 mt-0">
      <div className="grid gap-1.5">
        <StaffFormLabel>Tiểu sử / Bối cảnh *</StaffFormLabel>
        <StaffFormTextarea
          value={draft.background}
          onChange={(e) => set("background")(e.target.value)}
          placeholder="Mô tả cuộc đời, vai trò lịch sử..."
          className="min-h-[120px]"
          disabled={!isEditing}
        />
        <ValidationErrorText message={errors.background} />
      </div>

      <div className="grid gap-1.5">
        <StaffFormLabel>Tính cách *</StaffFormLabel>
        <StaffFormTextarea
          value={draft.personality}
          onChange={(e) => set("personality")(e.target.value)}
          placeholder="Đặc điểm tính cách, phong cách nói chuyện..."
          className="min-h-[90px]"
          disabled={!isEditing}
        />
        <ValidationErrorText message={errors.personality} />
      </div>
    </TabsContent>
  );
}

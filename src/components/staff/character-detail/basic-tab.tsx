"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  StaffFormLabel,
  StaffFormInput,
} from "@/components/staff/staff-form";
import { TabsContent } from "@/components/ui/tabs";
import type { BasicTabProps } from "./types";

function ValidationErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="text-[11px] font-medium text-accent-danger">
      {message}
    </p>
  ) : null;
}

export function BasicTab({ draft, set, isEditing, errors }: BasicTabProps) {
  return (
    <TabsContent value="basic" className="space-y-5 mt-0">

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <StaffFormLabel>Tên nhân vật *</StaffFormLabel>
          <StaffFormInput
            value={draft.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="VD: Ngô Quyền"
            disabled={!isEditing}
          />
          <ValidationErrorText message={errors.name} />
        </div>
        <div className="grid gap-1.5">
          <StaffFormLabel>Chức vị *</StaffFormLabel>
          <StaffFormInput
            value={draft.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="VD: Tiết độ sứ"
            disabled={!isEditing}
          />
          <ValidationErrorText message={errors.title} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-3">
          <StaffFormLabel>Ngày sinh</StaffFormLabel>
          <div className="grid grid-cols-[44px_54px_1fr_auto] gap-2 items-end">
            <StaffFormInput
              type="number"
              min={1}
              max={31}
              value={draft.bornDay}
              onChange={(e) => set("bornDay")(e.target.value)}
              placeholder="Ngày"
              disabled={!isEditing}
            />
            <StaffFormInput
              type="number"
              min={1}
              max={12}
              value={draft.bornMonth}
              onChange={(e) => set("bornMonth")(e.target.value)}
              placeholder="Tháng"
              disabled={!isEditing}
            />
            <StaffFormInput
              type="number"
              value={draft.bornYear}
              onChange={(e) => set("bornYear")(e.target.value)}
              placeholder="Năm"
              disabled={!isEditing}
            />
            <label className="flex h-10 items-center gap-2 rounded-md border border-card-light-border px-2 text-xs font-medium text-content-heading">
              <Checkbox
                checked={draft.isBornBc}
                onCheckedChange={(val) => set("isBornBc")(!!val)}
                disabled={!isEditing}
              />
              TCN
            </label>
          </div>
          <ValidationErrorText message={errors.bornDay || errors.bornMonth || errors.bornYear} />
        </div>

        <div className="grid gap-3">
          <StaffFormLabel>Ngày mất</StaffFormLabel>
          <div className="grid grid-cols-[44px_54px_1fr_auto] gap-2 items-end">
            <StaffFormInput
              type="number"
              min={1}
              max={31}
              value={draft.deathDay}
              onChange={(e) => set("deathDay")(e.target.value)}
              placeholder="Ngày"
              disabled={!isEditing}
            />
            <StaffFormInput
              type="number"
              min={1}
              max={12}
              value={draft.deathMonth}
              onChange={(e) => set("deathMonth")(e.target.value)}
              placeholder="Tháng"
              disabled={!isEditing}
            />
            <StaffFormInput
              type="number"
              value={draft.deathYear}
              onChange={(e) => set("deathYear")(e.target.value)}
              placeholder="Năm"
              disabled={!isEditing}
            />
            <label className="flex h-10 items-center gap-2 rounded-md border border-card-light-border px-2 text-xs font-medium text-content-heading">
              <Checkbox
                checked={draft.isDeathBc}
                onCheckedChange={(val) => set("isDeathBc")(!!val)}
                disabled={!isEditing}
              />
              TCN
            </label>
          </div>
          <ValidationErrorText message={errors.deathDay || errors.deathMonth || errors.deathYear} />
        </div>
      </div>
    </TabsContent>
  );
}

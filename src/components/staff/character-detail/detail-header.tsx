"use client";

import * as React from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { isValidUrl } from "@/lib/utils/url";
import { StaffPublishToggle } from "@/components/staff/staff-publish-toggle";
import { toast } from "sonner";
import type { CharacterDraft, FormTabKey } from "../staff-character-detail-view.types";
import type { ValidationErrors, CharacterValidationField } from "@/lib/utils/content-validation";

export interface DetailHeaderProps {
  mode: "create" | "edit";
  draft: CharacterDraft;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  isDirty: boolean;
  isCreated: boolean;
  isPending: boolean;
  canSave: boolean;
  canPublishCharacter: boolean;
  publishBlockedMessage: string;
  hasPublishErrors: boolean;
  publishValidationErrors: ValidationErrors<CharacterValidationField>;
  showValidationErrors: (errors?: ValidationErrors<CharacterValidationField>) => void;
  mappedContextsLength: number;
  setActiveTab: (tab: FormTabKey) => void;
  set: (field: keyof CharacterDraft) => (val: string | boolean) => void;
  handleSaveClick: () => void;
  setLeaveDialogOpen: (open: boolean) => void;
  setCancelDialogOpen: (open: boolean) => void;
  onBack: () => void;
}

export function DetailHeader({
  mode,
  draft,
  isEditing,
  setIsEditing,
  isDirty,
  isCreated,
  isPending,
  canSave,
  canPublishCharacter,
  publishBlockedMessage,
  hasPublishErrors,
  publishValidationErrors,
  showValidationErrors,
  mappedContextsLength,
  setActiveTab,
  set,
  handleSaveClick,
  setLeaveDialogOpen,
  setCancelDialogOpen,
  onBack,
}: DetailHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b border-card-light-border shrink-0"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-content-muted hover:bg-black/[0.08] dark:hover:bg-black/[0.08]"
          onClick={() => {
            if (isDirty && isEditing) {
              setLeaveDialogOpen(true);
            } else {
              onBack();
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0 bg-card-light-border"
          >
            {isValidUrl(draft.image) && (
              <Image
                src={draft.image}
                alt={draft.name || "avatar"}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-lg font-bold leading-tight text-content-heading">
                {mode === "create" && !isCreated
                  ? "Tạo nhân vật mới"
                  : draft.name || "Nhân vật"}
              </h1>
              {isCreated && (
                <StaffPublishToggle
                  isPublished={draft.isPublished}
                  disabled={!isEditing}
                  canPublish={canPublishCharacter}
                  blockedMessage={publishBlockedMessage}
                  entityLabel="nhân vật"
                  compact
                  onPublish={() => set("isPublished")(true)}
                  onUnpublish={() => set("isPublished")(false)}
                  onBlockedAttempt={() => {
                    if (hasPublishErrors) {
                      showValidationErrors(publishValidationErrors);
                    } else if (mappedContextsLength === 0) {
                      setActiveTab("context");
                      toast.error("Vui lòng liên kết bối cảnh lịch sử trước khi xuất bản.");
                    }
                  }}
                />
              )}
            </div>
            <p className="text-xs text-content-muted">
              {mode === "create" && !isCreated
                ? "Điền thông tin bên trái, xem preview chat bên phải"
                : draft.title}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing && (
          <>
            {isCreated && (
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-[var(--card-light-border)] hover:bg-black/[0.08] hover:border-[var(--content-muted)] text-[var(--content-heading)] transition-colors"
                onClick={() => {
                  if (isDirty) {
                    setCancelDialogOpen(true);
                  } else {
                    setIsEditing(false);
                  }
                }}
              >
                Hủy chỉnh sửa
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={!canSave}
              className="border-0 bg-[var(--accent-blue)] text-[var(--bg-deep)] font-semibold transition-all duration-200 hover:brightness-[0.85] hover:shadow-md cursor-pointer"
            >
              {isPending
                ? "Đang lưu..."
                : isCreated
                  ? "Lưu thay đổi"
                  : "Tạo nhân vật"}
            </Button>
          </>
        )}
        {isCreated && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-[var(--card-light-border)] hover:bg-black/[0.08] hover:border-[var(--content-muted)] text-[var(--content-heading)] hover:text-[var(--content-heading)] dark:hover:bg-black/[0.08] dark:hover:text-[var(--content-heading)] transition-colors"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Chỉnh sửa
          </Button>
        )}
      </div>
    </div>
  );
}

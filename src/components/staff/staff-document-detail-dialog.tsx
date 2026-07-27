"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormLabel, StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";

interface StaffDocumentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  /** Renders title/content as editable fields instead of plain text */
  editable?: boolean;
  /** Omit to render the corresponding field disabled even in editable mode */
  onTitleChange?: (value: string) => void;
  onContentChange?: (value: string) => void;
  titlePlaceholder?: string;
  contentPlaceholder?: string;
  /** Small badge rendered under the title in read-only mode (e.g. entity type) */
  titleBadge?: React.ReactNode;
  /** Extra info rendered between the title and the content (owner, linked entities, actions...) */
  meta?: React.ReactNode;
  emptyContentMessage?: string;
}

/**
 * Full-page document detail viewer/editor shared between the staff
 * Documents page and any staff detail form that attaches a RAG document
 * (character, historical context, ...). Document content routinely runs
 * past 10k characters, so this deliberately takes the whole viewport
 * instead of a small dialog/inline textarea that would force heavy
 * scrolling inside a cramped panel.
 */
export function StaffDocumentDetailDialog({
  open,
  onOpenChange,
  title,
  content,
  editable = false,
  onTitleChange,
  onContentChange,
  titlePlaceholder = "Tiêu đề tài liệu",
  contentPlaceholder = "Nội dung tài liệu...",
  titleBadge,
  meta,
  emptyContentMessage = "Chưa có nội dung.",
}: StaffDocumentDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="inset-0 translate-x-0 translate-y-0 w-full max-w-none sm:max-w-none rounded-none border-0 p-0 gap-0 shadow-none flex flex-col overflow-hidden"
      >
        <DialogHeader
          className="flex-row items-center gap-2.5 space-y-0 px-6 py-4 border-b border-card-light-border shrink-0"
        >
          <FileText className="h-5 w-5 text-accent-blue" />
          <DialogTitle className="text-base font-semibold text-content-heading">
            Chi tiết tài liệu
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-5">
            <div className="grid gap-1.5">
              {editable ? (
                <>
                  <StaffFormLabel>Tiêu đề tài liệu</StaffFormLabel>
                  <StaffFormInput
                    value={title}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    placeholder={titlePlaceholder}
                    disabled={!onTitleChange}
                    className="h-11 text-base font-semibold"
                  />
                </>
              ) : (
                <div>
                  <p className="text-xl font-semibold text-content-heading">
                    {title || "Tài liệu chưa đặt tên"}
                  </p>
                  {titleBadge && <div className="mt-2">{titleBadge}</div>}
                </div>
              )}
            </div>

            {meta}

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <StaffFormLabel>Nội dung tài liệu</StaffFormLabel>
                <span className="text-[11px] text-content-muted">
                  {content.length.toLocaleString("vi-VN")} ký tự
                </span>
              </div>
              {editable ? (
                <StaffFormTextarea
                  value={content}
                  onChange={(e) => onContentChange?.(e.target.value)}
                  placeholder={contentPlaceholder}
                  disabled={!onContentChange}
                  className="min-h-[55vh] resize-none text-sm leading-7"
                />
              ) : (
                <div
                  className="whitespace-pre-wrap rounded-xl border border-card-light-border bg-card-light-bg p-5 text-sm leading-7 text-content-muted"
                >
                  {content || emptyContentMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

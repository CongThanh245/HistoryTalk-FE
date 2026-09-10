"use client";

import * as React from "react";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { cn } from "@/lib/utils/cn";

interface StaffPublishToggleProps {
  isPublished: boolean;
  /** Disables the switch entirely (e.g. not in editing mode) */
  disabled?: boolean;
  /** Whether the entity currently meets the requirements to be published */
  canPublish?: boolean;
  /** Shown instead of the default description when canPublish is false */
  blockedMessage?: string;
  /** Noun used in the confirm-dialog copy, e.g. "nhân vật", "bối cảnh", "quiz" */
  entityLabel?: string;
  onPublish: () => void;
  onUnpublish: () => void;
  /** Fired when the user tries to publish while canPublish is false */
  onBlockedAttempt?: () => void;
  /** Smaller variant with no description text, for embedding in a page header */
  compact?: boolean;
  className?: string;
}

/**
 * Shared publish/unpublish switch for staff detail forms (characters,
 * historical contexts, quizzes, ...). Always confirms before switching in
 * either direction, since turning publish off immediately hides the entity
 * from end users just as turning it on immediately exposes it.
 */
export function StaffPublishToggle({
  isPublished,
  disabled = false,
  canPublish = true,
  blockedMessage,
  entityLabel = "nội dung",
  onPublish,
  onUnpublish,
  onBlockedAttempt,
  compact = false,
  className,
}: StaffPublishToggleProps) {
  const [pendingAction, setPendingAction] = React.useState<"publish" | "unpublish" | null>(null);

  const handleConfirm = () => {
    if (pendingAction === "publish") onPublish();
    if (pendingAction === "unpublish") onUnpublish();
    setPendingAction(null);
  };

  const showBlocked = !isPublished && !canPublish;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border transition-colors",
          compact ? "py-1.5 px-3" : "justify-between py-3 px-4",
          isPublished
            ? "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.06)]"
            : showBlocked
              ? "border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.05)]"
              : "border-card-light-border bg-[rgba(27,38,50,0.03)]",
          className,
        )}
      >
        <div className={compact ? undefined : "flex-1"}>
          <p
            className={cn(
              "font-semibold",
              compact ? "text-xs" : "text-sm",
              isPublished ? "text-[rgb(22,163,74)]" : showBlocked ? "text-[#92400e]" : "text-content-heading",
            )}
          >
            {isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
          </p>
          {!compact && (
            <p className="text-xs mt-0.5 text-content-muted">
              {showBlocked
                ? (blockedMessage ?? "⚠ Cần hoàn tất thông tin bắt buộc trước khi xuất bản.")
                : isPublished
                  ? `${entityLabel} đang hiển thị công khai cho người dùng.`
                  : `Bật để hiển thị ${entityLabel} cho người dùng.`}
            </p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublished}
          onClick={() => {
            if (disabled) return;
            if (!isPublished) {
              if (!canPublish) {
                onBlockedAttempt?.();
                return;
              }
              setPendingAction("publish");
            } else {
              setPendingAction("unpublish");
            }
          }}
          disabled={disabled}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
            isPublished ? "bg-[rgb(34,197,94)]" : "bg-[rgba(234,179,8,0.4)]",
          )}
        >
          <span
            className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform"
            style={{
              transform: isPublished ? "translateX(20px)" : "translateX(0)",
            }}
          />
        </button>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction === "unpublish" ? `Ẩn ${entityLabel} khỏi người dùng?` : `Xác nhận xuất bản ${entityLabel}?`}
        description={
          pendingAction === "unpublish"
            ? `Thao tác này sẽ ẩn ${entityLabel} khỏi người dùng. Bạn có thể xuất bản lại bất cứ lúc nào.`
            : `Khi xuất bản, ${entityLabel} này sẽ được hiển thị công khai cho người dùng.`
        }
        confirmLabel={pendingAction === "unpublish" ? "Ẩn khỏi người dùng" : "Đồng ý, xuất bản"}
        variant={pendingAction === "unpublish" ? "warning" : "primary"}
        onConfirm={handleConfirm}
      />
    </>
  );
}

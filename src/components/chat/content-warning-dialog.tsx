"use client";

import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Shown when the backend rejects a message for inappropriate wording. The message is not sent. */
export function ContentWarningDialog({
  message,
  onClose,
}: {
  /** null closes the dialog. */
  message: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0 text-(--status-warning)" aria-hidden="true" />
            Tin nhắn chưa được gửi
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-content-text">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button" onClick={onClose} className="btn-crimson min-h-0 px-4 py-2 text-sm">
            Sửa lại tin nhắn
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

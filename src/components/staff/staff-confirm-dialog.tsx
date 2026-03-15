"use client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; title?: string; description?: string; confirmLabel?: string; isPending?: boolean; onConfirm: () => void; }
export function StaffConfirmDialog({ open, onOpenChange, title = "Xác nhận xóa?", description = "Thao tác này không thể hoàn tác.", confirmLabel = "Xóa", isPending = false, onConfirm }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent style={{ backgroundColor: "#1a1f2e", borderColor: "rgba(255,255,255,0.1)" }}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: "#fff" }}>{title}</AlertDialogTitle>
          <AlertDialogDescription style={{ color: "#9ca3af" }}>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel style={{ color: "var(--content-muted)", backgroundColor: "transparent", border: "1px solid var(--card-light-border)" }}>Hủy</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" style={{ backgroundColor: "#ef4444" }} disabled={isPending} onClick={onConfirm}>
            {isPending ? "Đang xử lý..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

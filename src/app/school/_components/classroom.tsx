import { CLASSROOM_STATUS_LABELS } from "@/components/saas/class-form-dialog";
import type { ClassroomStatus } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

const STATUS_CLASS: Record<ClassroomStatus, string> = {
  ACTIVE: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
  INACTIVE: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  ARCHIVED: "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]",
};

export function ClassStatusBadge({ status }: { status: ClassroomStatus | string }) {
  const known = status as ClassroomStatus;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold",
        STATUS_CLASS[known] ?? STATUS_CLASS.ARCHIVED,
      )}
    >
      {CLASSROOM_STATUS_LABELS[known] ?? status}
    </span>
  );
}

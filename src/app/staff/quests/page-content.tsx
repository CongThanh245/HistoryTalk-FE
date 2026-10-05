"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Flame,
  Pencil,
  EyeOff,
  Eye,
  CheckCircle,
  XCircle,
  MessageCircle,
  Trophy,
  BookOpen,
  Coins,
  Target,
} from "lucide-react";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import {
  useAdminQuests,
  useAdminUpdateQuest,
  type AdminQuest,
  type AdminQuestType,
  type UpdateQuestPayload,
} from "@/features/admin/quest.hooks";

// ─── Constants ────────────────────────────────────────────────────────────────
// Chỉ 3 type đã wire sẵn ở backend (chat/quiz/đọc bối cảnh) — xem
// docs/GAMIFICATION_CRUD_PLAN.md §2.1. Không có Create/Delete: quest được seed
// sẵn tự động, staff chỉ chỉnh reward/target/title/trạng thái của quest có sẵn.
const TYPE_META: Record<AdminQuestType, { label: string; icon: typeof MessageCircle; color: string }> = {
  CHAT: { label: "Trò chuyện", icon: MessageCircle, color: "var(--quest-chat)" },
  QUIZ: { label: "Câu đố", icon: Trophy, color: "var(--quest-quiz)" },
  READ_CONTEXT: { label: "Đọc bối cảnh", icon: BookOpen, color: "var(--quest-read)" },
};

type QuestFormState = Required<UpdateQuestPayload>;

function toFormState(quest: AdminQuest): QuestFormState {
  return {
    type: quest.type,
    title: quest.title,
    target: quest.target,
    rewardTokens: quest.rewardTokens,
    order: quest.order,
    isActive: quest.isActive,
  };
}

// ─── Form Dialog (chỉnh sửa quest có sẵn — không có chế độ tạo mới) ───────────

interface QuestFormDialogProps {
  quest: AdminQuest | null;
  onOpenChange: (v: boolean) => void;
  onSave: (data: QuestFormState) => void;
  isPending: boolean;
}

function QuestFormDialog({ quest, onOpenChange, onSave, isPending }: QuestFormDialogProps) {
  const [form, setForm] = React.useState<QuestFormState | null>(null);
  const [prevQuest, setPrevQuest] = React.useState(quest);

  if (quest !== prevQuest) {
    setPrevQuest(quest);
    setForm(quest ? toFormState(quest) : null);
  }

  function set<K extends keyof QuestFormState>(key: K, value: QuestFormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const isValid = !!form && form.title.trim() !== "" && form.target >= 1 && form.rewardTokens >= 0;

  return (
    <Dialog open={!!quest} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md staff-theme rounded-[2px] bg-[var(--bg-surface)] border-[var(--text-primary)] text-content-text">
        <DialogHeader>
          <DialogTitle className="text-content-heading">Chỉnh sửa nhiệm vụ</DialogTitle>
          <DialogDescription className="text-content-muted">
            {quest?.questId} — mã nhiệm vụ không thể thay đổi vì là khoá liên kết với lịch sử tiến độ của user.
          </DialogDescription>
        </DialogHeader>

        {form && (
          <div className="space-y-4 py-1">
            {/* type */}
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">Loại hành động</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v as AdminQuestType)}>
                <SelectTrigger className="h-10 rounded-[2px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_META) as AdminQuestType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_META[t].label} ({t})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* title */}
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">
                Tiêu đề hiển thị <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="VD: Trò chuyện với một nhân vật lịch sử"
                className="h-10 rounded-[2px] border bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-heading"
              />
            </div>

            {/* target + rewardTokens */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-content-heading text-[13px]">
                  Mục tiêu (lần/ngày) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.target}
                  onChange={(e) => set("target", Number(e.target.value))}
                  className="h-10 rounded-[2px] border bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-heading"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-content-heading text-[13px]">
                  Thưởng (token) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.rewardTokens}
                  onChange={(e) => set("rewardTokens", Number(e.target.value))}
                  className="h-10 rounded-[2px] border bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-heading"
                />
              </div>
            </div>

            {/* order */}
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">Thứ tự hiển thị</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
                className="h-10 rounded-[2px] border bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-heading"
              />
            </div>

            {/* isActive toggle */}
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">Trạng thái</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set("isActive", true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-[2px] border text-sm font-semibold transition-all",
                    form.isActive
                      ? "bg-[var(--status-success-bg)] border-[var(--status-success-border)] text-[var(--status-success)]"
                      : "bg-transparent border-card-light-border text-content-muted"
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  Hoạt động
                </button>
                <button
                  type="button"
                  onClick={() => set("isActive", false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-[2px] border text-sm font-semibold transition-all",
                    !form.isActive
                      ? "bg-[var(--status-neutral-bg)] border-[var(--status-neutral-border)] text-[var(--text-tertiary)]"
                      : "bg-transparent border-card-light-border text-content-muted"
                  )}
                >
                  <XCircle className="w-4 h-4" />
                  Tạm dừng
                </button>
              </div>
              {form.isActive && (
                <p className="text-[11px] text-content-subtle">
                  Chỉ 1 nhiệm vụ đang hoạt động cho mỗi loại hành động — nhiệm vụ active thứ 2
                  cùng loại sẽ không tự cộng tiến độ được.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-[2px] border-card-light-border">
            Huỷ
          </Button>
          <Button
            onClick={() => form && onSave(form)}
            disabled={!isValid || isPending}
            className="rounded-[2px] border-0 bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)]"
          >
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffQuestsPageContent() {
  const { data: quests = [], isLoading, isFetching } = useAdminQuests();
  const updateQuest = useAdminUpdateQuest();

  const [editTarget, setEditTarget] = React.useState<AdminQuest | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const activeCount = quests.filter((q) => q.isActive).length;
  const totalRewardPool = quests.filter((q) => q.isActive).reduce((s, q) => s + q.rewardTokens, 0);

  /** Ẩn/bật lại nhanh — không có API xoá hẳn (xem docs/GAMIFICATION_CRUD_PLAN.md §2.1). */
  const handleToggleActive = React.useCallback(
    (quest: AdminQuest) => {
      setTogglingId(quest.id);
      updateQuest.mutate(
        { id: quest.id, payload: { isActive: !quest.isActive } },
        { onSettled: () => setTogglingId(null) }
      );
    },
    [updateQuest],
  );

  function handleSave(data: QuestFormState) {
    if (!editTarget) return;
    updateQuest.mutate(
      { id: editTarget.id, payload: data },
      { onSuccess: () => setEditTarget(null) }
    );
  }

  const columns = React.useMemo<ColumnDef<AdminQuest>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Nhiệm vụ",
        cell: ({ row: r }) => (
          <div className="min-w-[240px]">
            <p className="text-sm font-semibold text-content-heading">{r.original.title}</p>
            <p className="text-xs mt-0.5 text-content-muted">{r.original.questId}</p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Loại",
        cell: ({ row: r }) => {
          const meta = TYPE_META[r.original.type];
          const Icon = meta.icon;
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] text-[11px] font-bold border"
              style={{ background: `color-mix(in srgb, ${meta.color} 10%, transparent)`, borderColor: `color-mix(in srgb, ${meta.color} 25%, transparent)`, color: meta.color }}
            >
              <Icon className="w-3 h-3" />
              {meta.label}
            </span>
          );
        },
      },
      {
        id: "targetReward",
        header: "Mục tiêu / Thưởng",
        cell: ({ row: r }) => (
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 text-content-text">
              <Target className="w-3 h-3 text-content-muted" />
              {r.original.target}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-accent-gold">
              <Coins className="w-3 h-3" />
              {r.original.rewardTokens}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "order",
        header: "Thứ tự",
        cell: ({ row: r }) => <span className="text-xs text-content-muted">{r.original.order}</span>,
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row: r }) =>
          r.original.isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-[var(--status-success-bg)] text-[var(--status-success)] border border-[var(--status-success-border)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-success)] animate-pulse" />
              Hoạt động
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-[11px] font-bold bg-[var(--status-neutral-bg)] text-[var(--text-tertiary)] border border-[var(--status-neutral-border)]">
              <XCircle className="w-3 h-3" />
              Tạm dừng
            </span>
          ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row: r }) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-[2px] px-3 text-xs font-semibold gap-1.5 border-card-light-border text-content-heading"
              onClick={() => setEditTarget(r.original)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Sửa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={togglingId === r.original.id}
              className={cn(
                "h-8 rounded-[2px] px-3 text-xs font-semibold gap-1.5",
                r.original.isActive
                  ? "border-[var(--status-neutral-border)] text-[var(--text-tertiary)] bg-[var(--status-neutral-bg)]"
                  : "border-[var(--status-success-border)] text-[var(--status-success)] bg-[var(--status-success-bg)]"
              )}
              onClick={() => handleToggleActive(r.original)}
            >
              {r.original.isActive ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Ẩn
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Bật lại
                </>
              )}
            </Button>
          </div>
        ),
      },
    ],
    [togglingId, handleToggleActive],
  );

  return (
    <StaffShell
      title="Nhiệm vụ hằng ngày"
      label="Nội dung"
      description="Chỉnh phần thưởng, mục tiêu và trạng thái của các nhiệm vụ hằng ngày có sẵn (gamification)."
      icon={Flame}
      accent="var(--accent-gold)"
    >
      <div className="space-y-6">
        {!isLoading && (
          <StaffStatsGrid>
            <StaffStatCard label="Tổng số nhiệm vụ" value={quests.length} icon={<Target className="h-5 w-5" />} tone="blue" />
            <StaffStatCard label="Đang hoạt động" value={activeCount} icon={<CheckCircle className="h-5 w-5" />} tone="green" />
            <StaffStatCard
              label="Tổng thưởng/ngày"
              value={totalRewardPool.toLocaleString()}
              icon={<Coins className="h-5 w-5" />}
              tone="gold"
            />
          </StaffStatsGrid>
        )}

        <section className="rounded-[2px] border p-6 space-y-5 bg-[var(--bg-surface)] border-[var(--text-primary)]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-content-heading">Danh sách nhiệm vụ</h2>
              <p className="text-sm text-content-muted">
                {isLoading ? (
                  "Đang tải..."
                ) : (
                  <>
                    {quests.length} nhiệm vụ
                    {isFetching && <span className="ml-2 text-xs opacity-50">Đang cập nhật...</span>}
                  </>
                )}
              </p>
            </div>
          </div>

          <StaffDataTable
            columns={columns}
            data={quests}
            emptyMessage="Chưa có nhiệm vụ nào."
            isLoading={isLoading}
          />
        </section>
      </div>

      <QuestFormDialog
        quest={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSave={handleSave}
        isPending={updateQuest.isPending}
      />
    </StaffShell>
  );
}

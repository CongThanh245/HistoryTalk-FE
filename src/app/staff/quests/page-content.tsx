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
  CHAT: { label: "Trò chuyện", icon: MessageCircle, color: "#B45309" },
  QUIZ: { label: "Câu đố", icon: Trophy, color: "#6D28D9" },
  READ_CONTEXT: { label: "Đọc bối cảnh", icon: BookOpen, color: "#0F766E" },
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
      <DialogContent className="max-w-md staff-theme bg-card-light-bg border-card-light-border text-content-text">
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
                <SelectTrigger className="h-10 rounded-xl">
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
                className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
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
                  className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
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
                  className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
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
                className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
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
                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
                    form.isActive
                      ? "bg-[rgba(16,185,129,0.12)] border-[rgba(16,185,129,0.40)] text-[#10b981]"
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
                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
                    !form.isActive
                      ? "bg-[rgba(100,116,139,0.12)] border-[rgba(100,116,139,0.40)] text-[#64748b]"
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-card-light-border">
            Huỷ
          </Button>
          <Button
            onClick={() => form && onSave(form)}
            disabled={!isValid || isPending}
            className="rounded-xl border-0 bg-accent-gold text-white"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
              style={{ background: `${meta.color}18`, borderColor: `${meta.color}40`, color: meta.color }}
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hoạt động
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[rgba(100,116,139,0.10)] text-[#64748b] border border-[rgba(100,116,139,0.25)]">
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
              className="h-8 rounded-md px-3 text-xs font-semibold gap-1.5 border-card-light-border text-content-heading"
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
                "h-8 rounded-md px-3 text-xs font-semibold gap-1.5",
                r.original.isActive
                  ? "border-[rgba(100,116,139,0.30)] text-[#64748b] bg-[rgba(100,116,139,0.04)]"
                  : "border-[rgba(16,185,129,0.30)] text-[#10b981] bg-[rgba(16,185,129,0.04)]"
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

        <section className="rounded-2xl border p-6 space-y-5 bg-card-light-bg border-card-light-border">
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

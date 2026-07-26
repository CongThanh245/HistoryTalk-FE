"use client";

import * as React from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Coins,
  Calendar,
  CircleDollarSign,
  Package,
} from "lucide-react";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
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
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { cn } from "@/lib/utils/cn";
import {
  useAdminTiers,
  useAdminCreateTier,
  useAdminUpdateTier,
  useAdminDeleteTier,
  type AdminTier,
  type CreateTierPayload,
} from "@/features/admin/tier.hooks";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

const EMPTY_FORM: CreateTierPayload = {
  title: "",
  amount: 0,
  noMonth: 1,
  limitedToken: 0,
  isActive: true,
};

// Tier badge color based on title keyword
function getTierColor(title: string): { bg: string; text: string; border: string; glow: string } {
  const lower = title.toLowerCase();
  if (lower.includes("pro") || lower.includes("premium"))
    return {
      bg: "rgba(168,85,247,0.10)",
      text: "#a855f7",
      border: "rgba(168,85,247,0.25)",
      glow: "rgba(168,85,247,0.15)",
    };
  if (lower.includes("plus") || lower.includes("standard"))
    return {
      bg: "rgba(59,130,246,0.10)",
      text: "#3b82f6",
      border: "rgba(59,130,246,0.25)",
      glow: "rgba(59,130,246,0.15)",
    };
  return {
    bg: "rgba(100,116,139,0.10)",
    text: "#64748b",
    border: "rgba(100,116,139,0.25)",
    glow: "rgba(100,116,139,0.10)",
  };
}

// ─── Tier Card Component ──────────────────────────────────────────────────────

interface TierCardProps {
  tier: AdminTier;
  onEdit: (tier: AdminTier) => void;
  onDelete: (tier: AdminTier) => void;
}

function TierCard({ tier, onEdit, onDelete }: TierCardProps) {
  const color = getTierColor(tier.title);
  return (
    <div
      className="relative rounded-2xl border p-6 flex flex-col gap-5 transition-all duration-200 hover:shadow-lg bg-card-light-bg"
      style={{
        borderColor: color.border,
        boxShadow: `0 0 0 0 ${color.glow}`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${color.glow}`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 ${color.glow}`;
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: color.bg, border: `1px solid ${color.border}` }}
          >
            <CreditCard className="w-5 h-5" style={{ color: color.text }} />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-heading">
              {tier.title}
            </h3>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
            >
              {tier.tierId}
            </span>
          </div>
        </div>

        {/* Active badge */}
        {tier.isActive ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 bg-[rgba(100,116,139,0.10)] text-[#64748b] border border-[rgba(100,116,139,0.25)]">
            <XCircle className="w-3 h-3" />
            Tạm dừng
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-card-light-border" />

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <CircleDollarSign className="w-3.5 h-3.5 text-accent-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-content-subtle">
              Giá
            </span>
          </div>
          <p className="text-base font-extrabold text-content-heading">
            {tier.amount === 0 ? (
              <span className="text-[#10b981]">Miễn phí</span>
            ) : (
              formatVND(tier.amount)
            )}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent-blue" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-content-subtle">
              Thời hạn
            </span>
          </div>
          <p className="text-base font-extrabold text-content-heading">
            {tier.noMonth} <span className="text-xs font-normal text-content-muted">tháng</span>
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-accent-gold" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-content-subtle">
              Token
            </span>
          </div>
          <p className="text-base font-extrabold text-content-heading">
            {tier.limitedToken.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl gap-1.5 text-xs font-semibold border-card-light-border text-content-heading"
          onClick={() => onEdit(tier)}
        >
          <Pencil className="w-3.5 h-3.5" />
          Chỉnh sửa
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5 text-xs font-semibold border-[rgba(239,68,68,0.30)] text-[#ef4444] bg-[rgba(239,68,68,0.04)]"
          onClick={() => onDelete(tier)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Xóa
        </Button>
      </div>
    </div>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────

interface TierFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData?: AdminTier | null;
  onSave: (data: CreateTierPayload) => void;
  isPending: boolean;
}

function TierFormDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  isPending,
}: TierFormDialogProps) {
  const isEdit = !!initialData;
  const [form, setForm] = React.useState<CreateTierPayload>(EMPTY_FORM);

  // Sync form when dialog opens
  React.useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              title: initialData.title,
              amount: initialData.amount,
              noMonth: initialData.noMonth,
              limitedToken: initialData.limitedToken,
              isActive: initialData.isActive,
            }
          : EMPTY_FORM
      );
    }
  }, [open, initialData]);

  function set<K extends keyof CreateTierPayload>(key: K, value: CreateTierPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isValid = form.title.trim() !== "" && form.amount >= 0 && form.noMonth >= 1 && form.limitedToken >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md staff-theme bg-card-light-bg border-card-light-border text-content-text">
        <DialogHeader>
          <DialogTitle className="text-content-heading">
            {isEdit ? "Chỉnh sửa gói dịch vụ" : "Tạo gói dịch vụ mới"}
          </DialogTitle>
          <DialogDescription className="text-content-muted">
            {isEdit
              ? "Cập nhật thông tin gói dịch vụ hiện tại."
              : "Điền đầy đủ thông tin để tạo gói mới."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-content-heading text-[13px]">
              Tên gói <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="VD: Free, Plus, Pro..."
              className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
            />
          </div>

          {/* Amount + noMonth */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">
                Giá (VNĐ) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => set("amount", Number(e.target.value))}
                placeholder="0"
                className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
              />
              <p className="text-[11px] text-content-subtle">
                0 = Miễn phí
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">
                Số tháng <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={form.noMonth}
                onChange={(e) => set("noMonth", Number(e.target.value))}
                placeholder="1"
                className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
              />
            </div>
          </div>

          {/* Limited token */}
          <div className="space-y-1.5">
            <Label className="text-content-heading text-[13px]">
              Giới hạn token <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={form.limitedToken}
              onChange={(e) => set("limitedToken", Number(e.target.value))}
              placeholder="VD: 50000"
              className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
            />
          </div>

          {/* isActive toggle */}
          <div className="space-y-1.5">
            <Label className="text-content-heading text-[13px]">
              Trạng thái
            </Label>
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
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-card-light-border"
          >
            Huỷ
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!isValid || isPending}
            className="rounded-xl border-0 bg-accent-gold text-white"
          >
            {isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo gói"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSubscriptionsPageContent() {
  const { data: tiers = [], isLoading, isFetching } = useAdminTiers();
  const createTier = useAdminCreateTier();
  const updateTier = useAdminUpdateTier();
  const deleteTier = useAdminDeleteTier();

  // Form dialog
  const [formOpen, setFormOpen] = React.useState(false);
  const [formTarget, setFormTarget] = React.useState<AdminTier | null>(null);

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminTier | null>(null);

  // Derived stats
  const activeCount = tiers.filter((t) => t.isActive).length;
  const totalRevenue = tiers.reduce((s, t) => s + t.amount, 0);
  const totalTokenPool = tiers.reduce((s, t) => s + t.limitedToken, 0);

  function openCreate() {
    setFormTarget(null);
    setFormOpen(true);
  }

  function openEdit(tier: AdminTier) {
    setFormTarget(tier);
    setFormOpen(true);
  }

  function openDelete(tier: AdminTier) {
    setDeleteTarget(tier);
    setDeleteOpen(true);
  }

  function handleSave(data: CreateTierPayload) {
    if (formTarget) {
      updateTier.mutate(
        { id: formTarget.tierId, payload: data },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createTier.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  }

  const isPending = createTier.isPending || updateTier.isPending;

  return (
    <StaffShell
      title="Quản lý Gói dịch vụ"
      description="Quản lý các gói Free, Plus, Pro và chính sách giá."
      icon={CreditCard}
      accent="var(--accent-gold)"
    >
      <div className="space-y-6">
        {/* Stats */}
        {!isLoading && (
          <StaffStatsGrid>
            <StaffStatCard
              label="Tổng số gói"
              value={tiers.length}
              icon={<Package className="h-5 w-5" />}
              tone="blue"
            />
            <StaffStatCard
              label="Đang hoạt động"
              value={activeCount}
              icon={<CheckCircle className="h-5 w-5" />}
              tone="green"
            />
            <StaffStatCard
              label="Tổng token pool"
              value={totalTokenPool.toLocaleString()}
              icon={<Coins className="h-5 w-5" />}
              tone="gold"
            />
            <StaffStatCard
              label="Doanh thu tổng gói"
              value={formatVND(totalRevenue)}
              icon={<CircleDollarSign className="h-5 w-5" />}
              tone="amber"
            />
          </StaffStatsGrid>
        )}

        {/* Main card */}
        <section className="rounded-2xl border p-6 space-y-5 bg-card-light-bg border-card-light-border">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-base font-semibold text-content-heading">
                Danh sách gói dịch vụ
              </h2>
              <p className="text-sm text-content-muted">
                {isLoading ? (
                  "Đang tải..."
                ) : (
                  <>
                    {tiers.length} gói
                    {isFetching && (
                      <span className="ml-2 text-xs opacity-50">Đang cập nhật...</span>
                    )}
                  </>
                )}
              </p>
            </div>

            <Button
              onClick={openCreate}
              className="rounded-xl gap-2 font-semibold border-0 bg-accent-gold text-white"
            >
              <Plus className="h-4 w-4" />
              Tạo gói mới
            </Button>
          </div>

          {/* Cards grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border animate-pulse h-56 bg-card-light-border"
                />
              ))}
            </div>
          ) : tiers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent-gold/10 border border-accent-gold/20">
                <Package className="w-7 h-7 text-accent-gold" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-content-heading">
                  Chưa có gói dịch vụ nào
                </p>
                <p className="text-xs text-content-muted">
                  Bắt đầu bằng cách tạo gói đầu tiên.
                </p>
              </div>
              <Button
                onClick={openCreate}
                size="sm"
                className="rounded-xl gap-2 border-0 bg-accent-gold text-white"
              >
                <Plus className="h-4 w-4" />
                Tạo gói mới
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.tierId}
                  tier={tier}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create / Edit dialog */}
      <TierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialData={formTarget}
        onSave={handleSave}
        isPending={isPending}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa gói dịch vụ?"
        description={`Gói "${deleteTarget?.title}" sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`}
        confirmLabel={deleteTier.isPending ? "Đang xóa..." : "Xóa gói"}
        variant="danger"
        isPending={deleteTier.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteTier.mutate(deleteTarget.tierId, {
            onSuccess: () => {
              setDeleteOpen(false);
              setDeleteTarget(null);
            },
          });
        }}
      />
    </StaffShell>
  );
}

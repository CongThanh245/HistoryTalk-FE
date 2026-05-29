"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowCounterClockwiseIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  UserIcon,
  ShieldCheckIcon,
  CoinsIcon,
  LockKeyIcon,
  LockOpenIcon,
} from "@phosphor-icons/react";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  useAdminUsers,
  useAdminCreateUser,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminRestoreUser,
  useAdminPermanentDeleteUser,
  useAdminAddTokens,
  useAdminTokenAnalytics,
  type AdminUser,
} from "@/features/admin/hooks";

// ────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ────────────────────────────────────────────────────────────────────────────

type AdminRole = "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN";

// Helper to check if user is soft-deleted (API may use different field)
function isUserDeleted(user: AdminUser): boolean {
  return !!user.deletedAt;
}

interface RoleMeta {
  label: string;
  icon: React.ComponentType<any>;
  accent: string;
  description: string;
  showToken: boolean;
  showTier: boolean;
}

const ROLE_META: Record<string, RoleMeta> = {
  customer: {
    label: "Khách hàng",
    icon: UsersIcon,
    accent: "var(--accent-blue)",
    description: "Quản lý tài khoản khách hàng: khoá, đặt lại token, đổi gói.",
    showToken: true,
    showTier: true,
  },
  "content-admin": {
    label: "Content Admin",
    icon: UserIcon,
    accent: "var(--accent-bronze)",
    description: "Quản lý tài khoản biên tập viên nội dung.",
    showToken: false,
    showTier: false,
  },
  "system-admin": {
    label: "System Admin",
    icon: ShieldCheckIcon,
    accent: "var(--accent-gold)",
    description: "Quản lý tài khoản quản trị viên hệ thống.",
    showToken: false,
    showTier: false,
  },
};

const ROLE_ENUM: Record<string, AdminRole> = {
  customer: "CUSTOMER",
  "content-admin": "CONTENT_ADMIN",
  "system-admin": "SYSTEM_ADMIN",
};

const TIER_LABELS: Record<string, string> = {
  tier_free: "Free",
  tier_plus: "Plus",
  tier_pro: "Pro",
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tier_free: { bg: "rgba(100,116,139,0.10)", text: "rgb(71,85,105)", border: "rgba(100,116,139,0.25)" },
  tier_plus: { bg: "rgba(59,130,246,0.10)", text: "rgb(37,99,235)", border: "rgba(59,130,246,0.25)" },
  tier_pro: { bg: "rgba(168,85,247,0.10)", text: "rgb(126,34,206)", border: "rgba(168,85,247,0.25)" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

// ────────────────────────────────────────────────────────────────────────────
// Empty user form state
// ────────────────────────────────────────────────────────────────────────────

function buildEmptyUser(role: AdminRole): Partial<AdminUser> {
  return {
    role,
    userName: "",
    email: "",
    fullName: "",
    tierId: "tier_free",
    token: 0,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function AdminAccountsPage() {
  const { role: roleSlug } = useParams() as { role: string };

  const meta = ROLE_META[roleSlug] ?? ROLE_META["customer"];
  const roleEnum = ROLE_ENUM[roleSlug] ?? "CUSTOMER";

  // Data
  const { data: usersResponse, isLoading, isFetching } = useAdminUsers(roleEnum, { page: 0, size: 100 });
  const allUsers = usersResponse?.content ?? [];
  const createUser = useAdminCreateUser();
  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();
  const restoreUser = useAdminRestoreUser();
  const permanentDeleteUser = useAdminPermanentDeleteUser();
  const addTokens = useAdminAddTokens();

  // Token analytics (only for customer role)
  const { data: tokenAnalytics } = useAdminTokenAnalytics(
    roleEnum === "CUSTOMER" ? { granularity: "day" } : undefined
  );

  // UI state
  const [search, setSearch] = React.useState("");
  const [showTrash, setShowTrash] = React.useState(false);

  // Dialogs
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create");
  const [formTarget, setFormTarget] = React.useState<AdminUser | null>(null);
  const [formData, setFormData] = React.useState<Partial<AdminUser>>(() => buildEmptyUser(roleEnum));

  const [tokenDialogOpen, setTokenDialogOpen] = React.useState(false);
  const [tokenTarget, setTokenTarget] = React.useState<AdminUser | null>(null);
  const [tokenAmount, setTokenAmount] = React.useState("100");

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = React.useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = React.useState<AdminUser | null>(null);

  // Derived
  const activeItems = allUsers.filter((u) => !isUserDeleted(u));
  const trashedItems = allUsers.filter((u) => isUserDeleted(u));
  const baseList = showTrash ? trashedItems : activeItems;
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter(
      (u) =>
        u.userName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q)
    );
  }, [baseList, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openCreate() {
    setFormMode("create");
    setFormTarget(null);
    setFormData(buildEmptyUser(roleEnum));
    setFormOpen(true);
  }

  function openEdit(user: AdminUser) {
    setFormMode("edit");
    setFormTarget(user);
    setFormData({
      userName: user.userName,
      fullName: user.fullName,
      email: user.email,
      dob: user.dob ?? undefined,
      gender: user.gender ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
      address: user.address ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
    });
    setFormOpen(true);
  }

  function handleFormSave() {
    if (!formData.userName?.trim() || !formData.email?.trim()) return;
    if (formMode === "create") {
      createUser.mutate(formData as AdminUser, { onSuccess: () => setFormOpen(false) });
    } else if (formTarget) {
      // Only send allowed fields for update
      const updates = {
        userName: formData.userName,
        fullName: formData.fullName,
        dob: formData.dob,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        avatarUrl: formData.avatarUrl,
      };
      updateUser.mutate(
        { uid: formTarget.uid, updates },
        { onSuccess: () => setFormOpen(false) }
      );
    }
  }

  // Toggle active status via deactivate/restore API
  function handleToggleActive(user: AdminUser) {
    if (isUserDeleted(user)) {
      // Reactivate
      restoreUser.mutate({ uid: user.uid, role: user.role });
    } else {
      // Deactivate
      deleteUser.mutate({ uid: user.uid, role: user.role });
    }
  }

  function handleAddTokens() {
    if (!tokenTarget) return;
    const amount = parseInt(tokenAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    addTokens.mutate(
      { uid: tokenTarget.uid, amount },
      { onSuccess: () => setTokenDialogOpen(false) }
    );
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = React.useMemo<ColumnDef<AdminUser>[]>(() => {
    const base: ColumnDef<AdminUser>[] = [
      {
        accessorKey: "userName",
        header: "Người dùng",
        cell: ({ row }) => {
          const u = row.original;
          // Generate initials avatar
          const displayName = u.fullName || u.userName || "Unknown";
          const initials = displayName
            .split(" ")
            .slice(-2)
            .map((w: string) => w[0])
            .join("")
            .toUpperCase() || "?";
          const colors = [
            "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
            "#06b6d4", "#ef4444", "#6366f1",
          ];
          const bgColor = colors[u.uid.charCodeAt(u.uid.length - 1) % colors.length];
          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white select-none"
                style={{ background: bgColor }}
              >
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                  {u.fullName || u.userName}
                </p>
                <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                  {u.email}
                </p>
                {u.tierTitle && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {u.tierTitle}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
    ];

    // Customer specific columns
    if (meta.showTier) {
      base.push({
        accessorKey: "tierId",
        header: "Gói",
        cell: ({ row }) => {
          const tier = row.original.tierId || "tier_free";
          const c = TIER_COLORS[tier] ?? TIER_COLORS["tier_free"];
          return (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
            >
              {TIER_LABELS[tier] ?? tier}
            </span>
          );
        },
      });
    }

    if (meta.showToken) {
      base.push({
        accessorKey: "token",
        header: "Token",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <CoinsIcon className="h-3.5 w-3.5" style={{ color: "var(--accent-gold)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
              {row.original.token.toLocaleString()}
            </span>
          </div>
        ),
      });
    }

    base.push(
      {
        accessorKey: "lastActiveDate",
        header: "Hoạt động cuối",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {row.original.lastActiveDate ? timeAgo(row.original.lastActiveDate) : "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "deletedAt",
        header: "Trạng thái",
        cell: ({ row }) => {
          const u = row.original;
          const isDeleted = isUserDeleted(u);
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={!isDeleted}
                onCheckedChange={() => handleToggleActive(u)}
                disabled={deleteUser.isPending || restoreUser.isPending}
                className="data-[state=checked]:!bg-emerald-500"
              />
              <span
                className="text-xs font-semibold"
                style={{ color: !isDeleted ? "rgb(22,163,74)" : "var(--accent-danger)" }}
              >
                {!isDeleted ? "Kích hoạt" : "Đã khoá"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-2">Thao tác</div>,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {meta.showToken && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  title="Cộng token"
                  onClick={() => {
                    setTokenTarget(u);
                    setTokenAmount("100");
                    setTokenDialogOpen(true);
                  }}
                  style={{ color: "var(--accent-gold)" }}
                >
                  <CoinsIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                title={u.is_active ? "Khoá tài khoản" : "Mở khoá tài khoản"}
                onClick={() => handleToggleActive(u)}
                disabled={updateUser.isPending}
                style={{ color: u.is_active ? "var(--accent-danger)" : "rgb(22,163,74)" }}
              >
                {u.is_active ? (
                  <LockKeyIcon className="h-4 w-4" />
                ) : (
                  <LockOpenIcon className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                title="Chỉnh sửa"
                onClick={() => openEdit(u)}
                style={{ color: "var(--header-text-muted)" }}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                title="Xoá tạm"
                onClick={() => {
                  setDeleteTarget(u);
                  setDeleteOpen(true);
                }}
                style={{ color: "var(--accent-danger)" }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      }
    );

    return base;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, updateUser.isPending]);

  // ── Trash columns ─────────────────────────────────────────────────────────

  const trashColumns = React.useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: "userName",
        header: "Người dùng",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3 min-w-[200px] opacity-60">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <UserIcon className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold line-through" style={{ color: "var(--content-heading)" }}>
                  {u.fullName || u.userName}
                </p>
                <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                  {u.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "deletedAt",
        header: "Đã xoá lúc",
        cell: ({ row }) => {
          const d = row.original.deletedAt
            ? new Date(row.original.deletedAt)
            : null;
          return (
            <span className="text-xs" style={{ color: "var(--accent-danger)" }}>
              {d && !isNaN(d.getTime()) ? d.toLocaleString("vi-VN") : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-2">Thao tác</div>,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                title="Khôi phục"
                onClick={() => restoreUser.mutate({ uid: u.uid, role: u.role })}
                disabled={restoreUser.isPending}
                style={{ color: "rgb(22,163,74)" }}
              >
                <ArrowCounterClockwiseIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                title="Xoá vĩnh viễn"
                onClick={() => {
                  setPermanentDeleteTarget(u);
                  setPermanentDeleteOpen(true);
                }}
                style={{ color: "var(--accent-danger)" }}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [restoreUser]
  );

  const Icon = meta.icon;

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────

  return (
    <StaffShell
      title={`Quản lý ${meta.label}`}
      description={meta.description}
      icon={Icon}
      accent={meta.accent}
    >
      {/* ── Main table card ─────────────────────────────────────────────── */}
      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Count info */}
          <div className="space-y-0.5">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--content-heading)" }}
            >
              {showTrash ? `Thùng rác – ${meta.label}` : `Danh sách ${meta.label}`}
            </h2>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {isLoading ? (
                "Đang tải..."
              ) : (
                <>
                  {filtered.length} tài khoản
                  {isFetching && (
                    <span className="ml-2 text-xs opacity-50">Đang cập nhật...</span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-[280px]">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--content-subtle)" }}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, email..."
                className="pl-10 h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                }}
              />
            </div>

            {/* Trash toggle */}
            <Button
              variant="outline"
              className="h-10 rounded-xl px-4 font-semibold whitespace-nowrap"
              onClick={() => setShowTrash(!showTrash)}
              style={{
                borderColor: showTrash
                  ? "var(--accent-danger)"
                  : "var(--card-light-border)",
                color: showTrash
                  ? "var(--accent-danger)"
                  : "var(--content-heading)",
                background: showTrash ? "rgba(239,68,68,0.08)" : "transparent",
              }}
            >
              {showTrash ? (
                <>
                  <ArrowCounterClockwiseIcon className="h-4 w-4 mr-1.5" />
                  Danh sách
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  Thùng rác
                  {trashedItems.length > 0 && ` (${trashedItems.length})`}
                </>
              )}
            </Button>

            {/* Add button – only for active list */}
            {!showTrash && (
              <Button
                className="h-10 rounded-xl px-4 font-semibold border-0 whitespace-nowrap"
                onClick={openCreate}
                style={{
                  background: meta.accent,
                  color: "#fff",
                }}
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Thêm tài khoản
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <StaffDataTable
          columns={showTrash ? trashColumns : columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage={
            showTrash
              ? "Thùng rác trống."
              : `Không tìm thấy ${meta.label.toLowerCase()} phù hợp.`
          }
        />
      </section>

      {/* ── Token Analytics ───────────────────────────────────────────── */}
      {meta.showToken && !showTrash && !isLoading && tokenAnalytics && (
        <section
          className="rounded-2xl border p-6 space-y-4"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <CoinsIcon className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
            <h2 className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
              Thống kê Token Usage
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs text-muted-foreground">Total Tokens Used</p>
              <p className="text-lg font-bold" style={{ color: "var(--accent-gold)" }}>
                {tokenAnalytics.summary.totalTokens.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs text-muted-foreground">Remaining Tokens</p>
              <p className="text-lg font-bold" style={{ color: "rgb(22,163,74)" }}>
                {tokenAnalytics.summary.remainingTokens.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs text-muted-foreground">Users Out of Tokens</p>
              <p className="text-lg font-bold" style={{ color: "var(--accent-danger)" }}>
                {tokenAnalytics.summary.usersOutOfTokens}
              </p>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs text-muted-foreground">Avg Remaining</p>
              <p className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
                {Math.round(tokenAnalytics.summary.averageRemainingTokens).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Token Users */}
          {tokenAnalytics.topUsersByTokenUsage.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                Top người dùng tiêu thụ token
              </h3>
              <div className="space-y-2">
                {tokenAnalytics.topUsersByTokenUsage.slice(0, 5).map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ borderColor: "var(--card-light-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {user.userName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--content-heading)" }}>
                          {user.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "var(--accent-gold)" }}>
                        {user.totalTokens.toLocaleString()} tokens
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Còn: {user.remainingTokens.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Stats summary strip ─────────────────────────────────────────── */}
      {!showTrash && !isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Tổng tài khoản",
              value: activeItems.length,
              color: "var(--accent-blue)",
            },
            {
              label: "Đang kích hoạt",
              value: activeItems.filter((u) => !isUserDeleted(u)).length,
              color: "rgb(22,163,74)",
            },
            {
              label: "Đang bị khoá",
              value: activeItems.filter((u) => isUserDeleted(u)).length,
              color: "var(--accent-danger)",
            },
            ...(meta.showToken
              ? [
                  {
                    label: "Tổng token (hệ thống)",
                    value: tokenAnalytics?.summary.remainingTokens.toLocaleString() ?? activeItems.reduce((s, u) => s + (u.token || 0), 0).toLocaleString(),
                    color: "var(--accent-gold)",
                  },
                ]
              : [
                  {
                    label: "Trong thùng rác",
                    value: trashedItems.length,
                    color: "var(--content-muted)",
                  },
                ]),
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border p-4 flex flex-col gap-1"
              style={{
                background: "var(--card-light-bg)",
                borderColor: "var(--card-light-border)",
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--content-subtle)" }}>
                {stat.label}
              </span>
              <span className="text-2xl font-extrabold" style={{ color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit dialog ───────────────────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent
          className="max-w-md staff-theme"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            color: "var(--content-text)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--content-heading)" }}>
              {formMode === "create"
                ? `Thêm ${meta.label} mới`
                : `Chỉnh sửa tài khoản`}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              {formMode === "create"
                ? `Điền thông tin để tạo tài khoản ${meta.label.toLowerCase()} mới.`
                : "Cập nhật thông tin tài khoản người dùng."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Username */}
            <div className="space-y-1.5">
              <Label style={{ color: "var(--content-heading)", fontSize: 13 }}>
                Tên người dùng <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.userName ?? ""}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, userName: e.target.value }))}
                placeholder="Nhập tên người dùng"
                className="h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                  color: "var(--content-heading)",
                }}
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label style={{ color: "var(--content-heading)", fontSize: 13 }}>
                Họ và tên
              </Label>
              <Input
                value={formData.fullName ?? ""}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nhập họ và tên"
                className="h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                  color: "var(--content-heading)",
                }}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label style={{ color: "var(--content-heading)", fontSize: 13 }}>
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email ?? ""}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, email: e.target.value }))}
                placeholder="example@historytalk.vn"
                className="h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                  color: "var(--content-heading)",
                }}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label style={{ color: "var(--content-heading)", fontSize: 13 }}>
                Số điện thoại
              </Label>
              <Input
                value={formData.phoneNumber ?? ""}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, phoneNumber: e.target.value }))}
                placeholder="Nhập số điện thoại"
                className="h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                  color: "var(--content-heading)",
                }}
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label style={{ color: "var(--content-heading)", fontSize: 13 }}>
                Địa chỉ
              </Label>
              <Input
                value={formData.address ?? ""}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, address: e.target.value }))}
                placeholder="Nhập địa chỉ"
                className="h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                  color: "var(--content-heading)",
                }}
              />
            </div>

            {/* Tier – customer only (read only, can't change via update API) */}
            {meta.showTier && formTarget?.tierTitle && (
              <div className="space-y-1.5">
                <Label style={{ color: "var(--content-heading)", fontSize: 13 }}>Gói dịch vụ hiện tại</Label>
                <div className="h-10 rounded-xl border px-3 flex items-center text-sm"
                  style={{
                    background: "rgba(27,38,50,0.05)",
                    borderColor: "var(--card-light-border)",
                    color: "var(--content-heading)",
                  }}
                >
                  {formTarget.tierTitle}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="rounded-xl"
              style={{ borderColor: "var(--card-light-border)" }}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleFormSave}
              disabled={createUser.isPending || updateUser.isPending}
              className="rounded-xl border-0"
              style={{ background: meta.accent, color: "#fff" }}
            >
              {createUser.isPending || updateUser.isPending
                ? "Đang lưu..."
                : formMode === "create"
                ? "Tạo tài khoản"
                : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Token dialog (customer only) ──────────────────────────── */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent
          className="max-w-sm staff-theme"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            color: "var(--content-text)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--content-heading)" }}>
              Cộng thêm Token
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              Token sẽ được cộng thêm vào tài khoản{" "}
              <strong style={{ color: "var(--content-heading)" }}>
                {tokenTarget?.fullName || tokenTarget?.userName}
              </strong>
              . Hiện tại: <strong style={{ color: "var(--accent-gold)" }}>{tokenTarget?.token?.toLocaleString()}</strong> token.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label style={{ color: "var(--content-heading)", fontSize: 13 }}>
              Số token muốn cộng thêm
            </Label>
            <div className="flex gap-2">
              {["50", "100", "500", "1000"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTokenAmount(v)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold border transition-all"
                  style={{
                    background: tokenAmount === v ? "var(--accent-gold)" : "rgba(27,38,50,0.05)",
                    color: tokenAmount === v ? "#fff" : "var(--content-heading)",
                    borderColor: tokenAmount === v ? "var(--accent-gold)" : "var(--card-light-border)",
                  }}
                >
                  +{v}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              className="h-10 rounded-xl border mt-2"
              placeholder="Hoặc nhập tuỳ ý..."
              style={{
                background: "rgba(27,38,50,0.05)",
                borderColor: "var(--card-light-border)",
                color: "var(--content-heading)",
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTokenDialogOpen(false)}
              className="rounded-xl"
              style={{ borderColor: "var(--card-light-border)" }}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleAddTokens}
              disabled={addTokens.isPending}
              className="rounded-xl border-0"
              style={{ background: "var(--accent-gold)", color: "#fff" }}
            >
              <CoinsIcon className="h-4 w-4 mr-1.5" />
              {addTokens.isPending ? "Đang cộng..." : `Cộng ${tokenAmount} Token`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Soft delete confirm ────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Chuyển vào thùng rác?"
        description={`Tài khoản "${deleteTarget?.fullName || deleteTarget?.userName}" sẽ bị chuyển vào thùng rác. Bạn có thể khôi phục sau.`}
        confirmLabel={deleteUser.isPending ? "Đang xoá..." : "Chuyển vào thùng rác"}
        variant="danger"
        isPending={deleteUser.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteUser.mutate(
            { uid: deleteTarget.uid, role: deleteTarget.role },
            {
              onSuccess: () => {
                setDeleteOpen(false);
                setDeleteTarget(null);
              },
            }
          );
        }}
      />

      {/* ── Permanent delete confirm ───────────────────────────────────── */}
      <ConfirmDialog
        open={permanentDeleteOpen}
        onOpenChange={setPermanentDeleteOpen}
        title="Xoá vĩnh viễn tài khoản?"
        description={`Tài khoản "${permanentDeleteTarget?.fullName || permanentDeleteTarget?.userName}" sẽ bị xoá hoàn toàn khỏi hệ thống. Hành động này không thể hoàn tác.`}
        confirmLabel={permanentDeleteUser.isPending ? "Đang xoá..." : "Xoá vĩnh viễn"}
        variant="danger"
        isPending={permanentDeleteUser.isPending}
        onConfirm={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteUser.mutate(
            { uid: permanentDeleteTarget.uid, role: permanentDeleteTarget.role },
            {
              onSuccess: () => {
                setPermanentDeleteOpen(false);
                setPermanentDeleteTarget(null);
              },
            }
          );
        }}
      />
    </StaffShell>
  );
}

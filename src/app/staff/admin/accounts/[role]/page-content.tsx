"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Pencil,
  Plus,
  Search,
  Users,
  User,
  ShieldCheck,
  Coins,
  LockKeyhole,
  LockKeyholeOpen,
} from "lucide-react";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  useAdminUsers,
  useAdminCreateUser,
  useAdminUpdateUser,
  useAdminDeleteUser,
  useAdminRestoreUser,
  type AdminUser,
} from "@/features/admin/hooks";



// Types & helpers


type AdminRole = "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN";

// Helper to check if user is soft-deleted (API may use different field)
function isUserDeleted(user: AdminUser): boolean {
  return !!user.deletedAt;
}

interface RoleMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  description: string;
  showToken: boolean;
  showTier: boolean;
}

const ROLE_META: Record<string, RoleMeta> = {
  customer: {
    label: "Khách hàng",
    icon: Users,
    accent: "var(--accent-blue)",
    description: "Quản lý tài khoản khách hàng: xem danh sách, chỉnh sửa hồ sơ và khoá tài khoản.",
    showToken: true,
    showTier: true,
  },
  "content-admin": {
    label: "Content Admin",
    icon: User,
    accent: "var(--accent-bronze)",
    description: "Quản lý tài khoản biên tập viên nội dung.",
    showToken: false,
    showTier: false,
  },
  "system-admin": {
    label: "System Admin",
    icon: ShieldCheck,
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
  free: "Free",
  plus: "Plus",
  pro: "Pro",
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: "rgba(100,116,139,0.10)", text: "rgb(71,85,105)", border: "rgba(100,116,139,0.25)" },
  plus: { bg: "rgba(59,130,246,0.10)", text: "rgb(37,99,235)", border: "rgba(59,130,246,0.25)" },
  pro: { bg: "rgba(168,85,247,0.10)", text: "rgb(126,34,206)", border: "rgba(168,85,247,0.25)" },
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


// Empty user form state


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


// Page


export default function AdminAccountsPage() {
  const { role: roleSlug } = useParams() as { role: string };

  const meta = ROLE_META[roleSlug] ?? ROLE_META["customer"];
  const roleEnum = ROLE_ENUM[roleSlug] ?? "CUSTOMER";

  // Data
  const { data: usersResponse, isLoading, isFetching } = useAdminUsers(roleEnum, { page: 0, size: 100 });
  const allUsers = React.useMemo(() => usersResponse?.content ?? [], [usersResponse?.content]);
  const createUser = useAdminCreateUser();
  const updateUser = useAdminUpdateUser();
  const deleteUser = useAdminDeleteUser();
  const restoreUser = useAdminRestoreUser();

  // POST /auth/register-content-admin chỉ nhận roleName CONTENT_ADMIN | SYSTEM_ADMIN — không tạo được CUSTOMER qua đây.
  const canCreate = roleEnum === "CONTENT_ADMIN" || roleEnum === "SYSTEM_ADMIN";

  // UI state
  const [search, setSearch] = React.useState("");

  // Dialogs
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<"create" | "edit">("edit");
  const [formTarget, setFormTarget] = React.useState<AdminUser | null>(null);
  const [formData, setFormData] = React.useState<Partial<AdminUser>>(() => buildEmptyUser(roleEnum));
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminUser | null>(null);

  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [restoreTarget, setRestoreTarget] = React.useState<AdminUser | null>(null);

  // Derived
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.userName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q)
    );
  }, [allUsers, search]);



  function openCreate() {
    setFormMode("create");
    setFormTarget(null);
    setFormData(buildEmptyUser(roleEnum));
    setPassword("");
    setConfirmPassword("");
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
    if (formMode === "create") {
      if (!formData.userName?.trim() || !formData.fullName?.trim() || !formData.email?.trim()) return;
      if (password.length < 6 || password !== confirmPassword) return;
      createUser.mutate(
        {
          userName: formData.userName.trim(),
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password,
          confirmPassword,
          roleName: roleEnum as "CONTENT_ADMIN" | "SYSTEM_ADMIN",
        },
        { onSuccess: () => setFormOpen(false) }
      );
      return;
    }

    if (!formTarget || !formData.userName?.trim()) return;
    const updates = {
      userName: formData.userName,
      fullName: formData.fullName,
      dob: formData.dob ?? undefined,
      gender: formData.gender ?? undefined,
      phoneNumber: formData.phoneNumber ?? undefined,
      address: formData.address ?? undefined,
      avatarUrl: formData.avatarUrl ?? undefined,
    };
    updateUser.mutate(
      { uid: formTarget.uid, updates },
      { onSuccess: () => setFormOpen(false) }
    );
  }

  const isFormValid =
    formMode === "create"
      ? !!formData.userName?.trim() &&
        !!formData.fullName?.trim() &&
        !!formData.email?.trim() &&
        password.length >= 6 &&
        password === confirmPassword
      : !!formData.userName?.trim();



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
          const uidKey = u.uid || displayName;
          const bgColor = colors[uidKey.charCodeAt(uidKey.length - 1) % colors.length];
          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              <div
                className="flex items-center justify-center text-sm font-bold text-white rounded-full select-none w-9 h-9 shrink-0"
                style={{ background: bgColor }}
              >
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-content-heading">
                  {u.fullName || u.userName}
                </p>
                <p className="text-xs text-content-muted">
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
          const tier = row.original.tierTitle || "free";
          const c = TIER_COLORS[tier] ?? TIER_COLORS["free"];
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
            <Coins className="h-3.5 w-3.5 text-accent-gold" />
            <span className="text-sm font-semibold text-content-heading">
              {row.original.token.toLocaleString()}
            </span>
          </div>
        ),
      });
    }

    base.push(
      {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="text-xs text-content-muted">
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
          return isDeleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-[rgba(239,68,68,0.12)] text-[#ef4444] border border-[rgba(239,68,68,0.25)]">
              <LockKeyhole className="w-3 h-3" />
              Đã khóa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.25)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Hoạt động
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="pr-2 text-right">Thao tác</div>,
        cell: ({ row }) => {
          const u = row.original;
          const isDeleted = isUserDeleted(u);
          return (
            <div className="flex items-center justify-end gap-1">
              {isDeleted ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-[#10b981]"
                  title="Mở khóa tài khoản"
                  onClick={() => {
                    setRestoreTarget(u);
                    setRestoreOpen(true);
                  }}
                  disabled={restoreUser.isPending}
                >
                  <LockKeyholeOpen className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-accent-danger"
                  title="Khóa tài khoản"
                  onClick={() => {
                    setDeleteTarget(u);
                    setDeleteOpen(true);
                  }}
                  disabled={deleteUser.isPending}
                >
                  <LockKeyhole className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-[var(--header-text-muted)]"
                title="Chỉnh sửa"
                onClick={() => openEdit(u)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      }
    );

    return base;
  }, [meta, deleteUser.isPending, restoreUser.isPending]);


  const Icon = meta.icon;


  // Render


  return (
    <StaffShell
      title={`Quản lý ${meta.label}`}
      description={meta.description}
      icon={Icon}
      accent={meta.accent}
    >
      <div className="space-y-6">
      {/* Stats summary strip */}
      {!isLoading && (
        <StaffStatsGrid>
          <StaffStatCard
            label="Tổng tài khoản"
            value={allUsers.length}
            icon={<Users className="w-5 h-5" />}
            tone="blue"
          />
          <StaffStatCard
            label="Đang hoạt động"
            value={allUsers.filter((u) => !isUserDeleted(u)).length}
            icon={<ShieldCheck className="w-5 h-5" />}
            tone="green"
          />
          <StaffStatCard
            label="Đang bị khoá"
            value={allUsers.filter((u) => isUserDeleted(u)).length}
            icon={<LockKeyhole className="w-5 h-5" />}
            tone="red"
          />
          {meta.showToken && (
            <StaffStatCard
              label="Tổng token còn lại"
              value={allUsers.reduce((s, u) => s + (u.token || 0), 0).toLocaleString()}
              icon={<Coins className="w-5 h-5" />}
              tone="gold"
            />
          )}
        </StaffStatsGrid>
      )}
      {/* Main table card */}
      <section className="p-6 space-y-5 border rounded-2xl bg-card-light-bg border-card-light-border">
        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Count info */}
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-content-heading">
              {`Danh sách ${meta.label}`}
            </h2>
            <p className="text-sm text-content-muted">
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
          <div className="flex flex-col w-full gap-2 sm:flex-row sm:items-center sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-content-subtle" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên, email..."
                className="pl-10 h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border"
              />
            </div>
            {canCreate && (
              <Button
                onClick={openCreate}
                className="text-white border-0 rounded-xl gap-1.5 shrink-0"
                style={{ background: meta.accent }}
              >
                <Plus className="w-4 h-4" />
                Tạo tài khoản
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <StaffDataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          emptyMessage={`Không tìm thấy ${meta.label.toLowerCase()} phù hợp.`}
        />
      </section>

      {/* Create / Edit dialog */}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md staff-theme bg-card-light-bg border-card-light-border text-content-text">
          <DialogHeader>
            <DialogTitle className="text-content-heading">
              {formMode === "create" ? `Tạo tài khoản ${meta.label}` : "Chỉnh sửa tài khoản"}
            </DialogTitle>
            <DialogDescription className="text-content-muted">
              {formMode === "create"
                ? `Tài khoản mới sẽ có vai trò ${meta.label} và đăng nhập được ngay bằng email/mật khẩu bên dưới.`
                : "Cập nhật thông tin tài khoản người dùng."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-1 space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">
                Tên người dùng <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.userName ?? ""}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, userName: e.target.value }))}
                placeholder="Nhập tên người dùng"
                className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">
                Họ và tên {formMode === "create" && <span className="text-destructive">*</span>}
              </Label>
              <Input
                value={formData.fullName ?? ""}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nhập họ và tên"
                className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-content-heading text-[13px]">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email ?? ""}
                disabled={formMode === "edit"}
                onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, email: e.target.value }))}
                placeholder="example@historytalk.vn"
                className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading disabled:opacity-60"
              />
            </div>

            {formMode === "create" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-content-heading text-[13px]">
                    Mật khẩu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-content-heading text-[13px]">
                    Xác nhận mật khẩu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[11px] text-destructive">Mật khẩu xác nhận không khớp.</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Phone Number */}
                <div className="space-y-1.5">
                  <Label className="text-content-heading text-[13px]">
                    Số điện thoại
                  </Label>
                  <Input
                    value={formData.phoneNumber ?? ""}
                    onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="Nhập số điện thoại"
                    className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label className="text-content-heading text-[13px]">
                    Địa chỉ
                  </Label>
                  <Input
                    value={formData.address ?? ""}
                    onChange={(e) => setFormData((p: Partial<AdminUser>) => ({ ...p, address: e.target.value }))}
                    placeholder="Nhập địa chỉ"
                    className="h-10 rounded-xl border bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading"
                  />
                </div>

                {/* Tier - customer only (read only, cannot change via update API) */}
                {meta.showTier && formTarget?.tierTitle && (
                  <div className="space-y-1.5">
                    <Label className="text-content-heading text-[13px]">Gói dịch vụ hiện tại</Label>
                    <div className="h-10 rounded-xl border px-3 flex items-center text-sm bg-[rgba(27,38,50,0.05)] border-card-light-border text-content-heading">
                      {formTarget.tierTitle}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              className="rounded-xl border-card-light-border"
            >
              Huỷ
            </Button>
            <Button
              onClick={handleFormSave}
              disabled={!isFormValid || createUser.isPending || updateUser.isPending}
              className="text-white border-0 rounded-xl"
              style={{ background: meta.accent }}
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

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Khóa tài khoản?"
        description={`Tài khoản "${deleteTarget?.fullName || deleteTarget?.userName}" sẽ bị vô hiệu hóa. Bạn có thể mở khóa lại bất kỳ lúc nào.`}
        confirmLabel={deleteUser.isPending ? "Đang khóa..." : "Khóa tài khoản"}
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

      {/* Restore confirm */}
      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Mở khóa tài khoản?"
        description={`Tài khoản "${restoreTarget?.fullName || restoreTarget?.userName}" sẽ được kích hoạt trở lại.`}
        confirmLabel={restoreUser.isPending ? "Đang mở khóa..." : "Mở khóa"}
        variant="primary"
        isPending={restoreUser.isPending}
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreUser.mutate(
            { uid: restoreTarget.uid, role: restoreTarget.role },
            {
              onSuccess: () => {
                setRestoreOpen(false);
                setRestoreTarget(null);
              },
            }
          );
        }}
      />

    </StaffShell>
  );
}

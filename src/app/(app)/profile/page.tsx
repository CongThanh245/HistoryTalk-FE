"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useMyPaymentHistory,
} from "@/features/profile/hooks";
import { isPro } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";
import {
  UserIcon,
  CrownSimpleIcon,
  LockSimpleIcon,
  CoinsIcon,
  CalendarIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  LinkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type TabKey = "profile" | "billing" | "security";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Hồ sơ cá nhân", icon: UserIcon },
  { key: "billing", label: "Gói & Token", icon: CrownSimpleIcon },
  { key: "security", label: "Bảo mật", icon: LockSimpleIcon },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    PAID: { label: "Thành công", color: "#22c55e", icon: CheckCircleIcon },
    PENDING: { label: "Chờ thanh toán", color: "#f59e0b", icon: ClockIcon },
    CANCELLED: { label: "Đã hủy", color: "#ef4444", icon: XCircleIcon },
    EXPIRED: { label: "Hết hạn", color: "#6b7280", icon: XCircleIcon },
  };
  const cfg = map[status] ?? { label: status, color: "#6b7280", icon: ClockIcon };
  const IconEl = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
    >
      <IconEl className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

// ── Tab 1: Hồ sơ cá nhân ────────────────────
function PersonalProfileTab() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [form, setForm] = useState({
    fullName: "",
    userName: "",
    phoneNumber: "",
    address: "",
    dob: "",
    gender: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        userName: profile.userName ?? "",
        phoneNumber: profile.phoneNumber ?? "",
        address: profile.address ?? "",
        dob: profile.dob ? profile.dob.slice(0, 10) : "",
        gender: profile.gender ?? "",
        avatarUrl: profile.avatarUrl ?? "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: form.fullName || undefined,
      userName: form.userName || undefined,
      phoneNumber: form.phoneNumber || undefined,
      address: form.address || undefined,
      dob: form.dob || undefined,
      gender: (form.gender as "MALE" | "FEMALE" | "OTHER") || undefined,
      avatarUrl: form.avatarUrl || undefined,
    });
  };

  if (isLoading) return <ProfileSkeleton />;

  const initials = (profile?.userName ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar
            className="w-20 h-20 border-2"
            style={{ borderColor: isPro(profile ?? null) ? "var(--accent-gold)" : "var(--border-strong)" }}
          >
            <AvatarImage src={form.avatarUrl || undefined} alt={profile?.userName} />
            <AvatarFallback
              className="text-xl font-bold"
              style={{
                background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {profile?.fullName || profile?.userName || "—"}
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {profile?.email}
          </p>
          {isPro(profile ?? null) && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full"
              style={{
                background: "linear-gradient(90deg,rgba(201,162,77,0.18),rgba(163,81,57,0.12))",
                color: "var(--accent-gold)",
                border: "1px solid rgba(201,162,77,0.3)",
              }}
            >
              <CrownSimpleIcon className="w-3 h-3" weight="fill" />
              {profile?.tierTitle}
            </span>
          )}
        </div>
      </div>

      {/* Form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Họ và tên"
          icon={UserIcon}
          value={form.fullName}
          onChange={(v) => setForm({ ...form, fullName: v })}
          placeholder="Nguyễn Văn A"
        />
        <FormField
          label="Tên người dùng"
          icon={UserIcon}
          value={form.userName}
          onChange={(v) => setForm({ ...form, userName: v })}
          placeholder="nguyenvana"
        />
        <FormField
          label="Email"
          icon={EnvelopeIcon}
          value={profile?.email ?? ""}
          onChange={() => {}}
          disabled
          placeholder="email@example.com"
        />
        <FormField
          label="Số điện thoại"
          icon={PhoneIcon}
          value={form.phoneNumber}
          onChange={(v) => setForm({ ...form, phoneNumber: v })}
          placeholder="0901234567"
          type="tel"
        />
        <FormField
          label="Ngày sinh"
          icon={CalendarIcon}
          value={form.dob}
          onChange={(v) => setForm({ ...form, dob: v })}
          placeholder=""
          type="date"
        />

        {/* Gender Select */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <UserIcon className="w-3.5 h-3.5" />
            Giới tính
          </Label>
          <Select
            value={form.gender}
            onValueChange={(v) => setForm({ ...form, gender: v })}
          >
            <SelectTrigger
              className="h-10 border text-sm"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
                borderRadius: "10px",
              }}
            >
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Nam</SelectItem>
              <SelectItem value="FEMALE">Nữ</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <FormField
            label="Địa chỉ"
            icon={MapPinIcon}
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            placeholder="123 Lê Lợi, Quận 1, TP.HCM"
          />
        </div>

        <div className="md:col-span-2">
          <FormField
            label="Đường dẫn Avatar (URL)"
            icon={LinkIcon}
            value={form.avatarUrl}
            onChange={(v) => setForm({ ...form, avatarUrl: v })}
            placeholder="https://example.com/avatar.jpg"
            type="url"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="px-6 font-semibold"
          style={{
            background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            color: "var(--text-inverse)",
            borderRadius: "10px",
            boxShadow: "0 2px 10px var(--accent-gold-glow, rgba(201,162,77,0.35))",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        className="text-sm font-medium flex items-center gap-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 border text-sm"
        style={{
          background: disabled ? "var(--bg-main)" : "var(--bg-elevated)",
          borderColor: "var(--border-default)",
          color: disabled ? "var(--text-muted)" : "var(--text-primary)",
          borderRadius: "10px",
          opacity: disabled ? 0.7 : 1,
        }}
      />
    </div>
  );
}

// ── Tab 2: Billing & Token ───────────────────
function BillingTab() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: payments, isLoading: paymentsLoading } = useMyPaymentHistory();
  const proUser = isPro(profile ?? null);

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <div
        className="rounded-2xl p-5 border relative overflow-hidden"
        style={{
          background: proUser
            ? "linear-gradient(135deg, rgba(201,162,77,0.14) 0%, rgba(163,81,57,0.10) 100%)"
            : "var(--bg-elevated)",
          borderColor: proUser ? "rgba(201,162,77,0.4)" : "var(--border-default)",
          boxShadow: proUser ? "0 4px 20px rgba(201,162,77,0.1)" : "none",
        }}
      >
        {proUser && (
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(201,162,77,0.7),transparent)" }}
          />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: proUser
                  ? "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)"
                  : "var(--bg-main)",
                border: proUser ? "none" : "1px solid var(--border-default)",
                boxShadow: proUser ? "0 2px 12px var(--accent-gold-glow,rgba(201,162,77,0.4))" : "none",
              }}
            >
              <CrownSimpleIcon
                className="w-5 h-5"
                weight={proUser ? "fill" : "regular"}
                style={{ color: proUser ? "var(--text-inverse)" : "var(--text-muted)" }}
              />
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                {profile?.tierTitle ?? "Gói miễn phí"}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {proUser ? "Tài khoản Premium đang hoạt động" : "Nâng cấp để mở khóa toàn bộ tính năng"}
              </p>
            </div>
          </div>
          {proUser ? (
            <Badge
              className="font-bold text-[10px] px-2 py-1 border-0 shrink-0"
              style={{ background: "rgba(201,162,77,0.15)", color: "var(--accent-gold)" }}
            >
              ✦ PRO
            </Badge>
          ) : (
            <Badge
              className="font-bold text-[10px] px-2 py-1 border-0 shrink-0"
              style={{ background: "var(--bg-main)", color: "var(--text-muted)", border: "1px solid var(--border-default)" }}
            >
              Free
            </Badge>
          )}
        </div>

        {/* Token display */}
        {profileLoading ? (
          <Skeleton className="h-14 w-full mt-4 rounded-xl" />
        ) : (
          <div
            className="mt-4 rounded-xl p-4 flex items-center gap-3"
            style={{
              background: "var(--bg-main)",
              border: "1px solid var(--border-default)",
            }}
          >
            <CoinsIcon
              className="w-8 h-8 shrink-0"
              weight="duotone"
              style={{ color: proUser ? "var(--accent-gold)" : "var(--text-muted)" }}
            />
            <div>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {(profile?.token ?? 0).toLocaleString("vi-VN")}
              </p>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Token AI còn lại
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-secondary)" }}>
          Lịch sử giao dịch
        </h3>

        {paymentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !payments || payments.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center border"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
          >
            <CoinsIcon className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Chưa có giao dịch nào
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.orderId}
                className="rounded-xl p-4 border flex items-center justify-between gap-4"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: p.status === "PAID"
                        ? "rgba(34,197,94,0.12)"
                        : "var(--bg-main)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <CrownSimpleIcon
                      className="w-4 h-4"
                      weight="fill"
                      style={{ color: p.status === "PAID" ? "#22c55e" : "var(--text-muted)" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {p.tierTitle}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(p.paidAt ?? p.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(p.amount)}
                  </span>
                  {statusBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 3: Security ──────────────────────────
function SecurityTab() {
  const { mutate: changePassword, isPending } = useChangePassword();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.currentPassword) errs.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (!form.newPassword) errs.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (form.newPassword.length < 8) errs.newPassword = "Mật khẩu tối thiểu 8 ký tự";
    if (!form.confirmPassword) errs.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    changePassword(
      {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      },
      {
        onSuccess: () =>
          setForm({ currentPassword: "", newPassword: "", confirmPassword: "" }),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div
        className="rounded-xl p-4 border text-sm flex items-start gap-2"
        style={{
          background: "rgba(139,179,200,0.08)",
          borderColor: "rgba(139,179,200,0.25)",
          color: "var(--accent-blue, #8fb3c8)",
        }}
      >
        <LockSimpleIcon className="w-4 h-4 mt-0.5 shrink-0" weight="fill" />
        <span>Để bảo vệ tài khoản, mật khẩu mới phải có ít nhất 8 ký tự và khác mật khẩu hiện tại.</span>
      </div>

      {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => {
        const labels: Record<string, string> = {
          currentPassword: "Mật khẩu hiện tại",
          newPassword: "Mật khẩu mới",
          confirmPassword: "Xác nhận mật khẩu mới",
        };
        return (
          <div key={field} className="space-y-1.5">
            <Label
              htmlFor={field}
              className="text-sm font-medium flex items-center gap-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              <LockSimpleIcon className="w-3.5 h-3.5" />
              {labels[field]}
            </Label>
            <Input
              id={field}
              type="password"
              value={form[field]}
              onChange={(e) => {
                setForm({ ...form, [field]: e.target.value });
                if (errors[field]) setErrors({ ...errors, [field]: "" });
              }}
              placeholder="••••••••"
              className="h-10 border text-sm"
              style={{
                background: "var(--bg-elevated)",
                borderColor: errors[field] ? "var(--accent-danger, #ef4444)" : "var(--border-default)",
                color: "var(--text-primary)",
                borderRadius: "10px",
              }}
            />
            {errors[field] && (
              <p className="text-xs" style={{ color: "var(--accent-danger, #ef4444)" }}>
                {errors[field]}
              </p>
            )}
          </div>
        );
      })}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full font-semibold"
        style={{
          background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
          color: "var(--text-inverse)",
          borderRadius: "10px",
          boxShadow: "0 2px 10px var(--accent-gold-glow, rgba(201,162,77,0.35))",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.find((t) => t.key === tabParam)?.key ?? "profile"
  );
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const proUser = isPro(profile ?? null);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/profile?tab=${key}`, { scroll: false });
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl md:text-3xl font-extrabold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {proUser && (
                <span
                  className="inline-flex items-center mr-2 align-middle"
                  style={{ color: "var(--accent-gold)" }}
                >
                  ✦
                </span>
              )}
              Hồ sơ của tôi
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Quản lý thông tin tài khoản & gói dịch vụ
            </p>
          </div>

          {proUser && profile?.tierTitle && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: "linear-gradient(135deg,rgba(201,162,77,0.18),rgba(163,81,57,0.12))",
                color: "var(--accent-gold)",
                border: "1px solid rgba(201,162,77,0.35)",
                boxShadow: "0 2px 10px rgba(201,162,77,0.12)",
              }}
            >
              <CrownSimpleIcon className="w-3.5 h-3.5" weight="fill" />
              {profile.tierTitle}
            </div>
          )}
        </div>

        {/* ── Tab nav ── */}
        <div
          className="flex gap-1 p-1 rounded-2xl border"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
          }}
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: isActive
                    ? key === "billing" && proUser
                      ? "linear-gradient(135deg,rgba(201,162,77,0.22),rgba(163,81,57,0.15))"
                      : "var(--bg-main)"
                    : "transparent",
                  color: isActive
                    ? key === "billing" && proUser
                      ? "var(--accent-gold)"
                      : "var(--text-primary)"
                    : "var(--text-muted)",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                  border: isActive && key === "billing" && proUser
                    ? "1px solid rgba(201,162,77,0.3)"
                    : "1px solid transparent",
                }}
              >
                <Icon className="w-4 h-4" weight={isActive ? "fill" : "regular"} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border-default)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}
        >
          {activeTab === "profile" && <PersonalProfileTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

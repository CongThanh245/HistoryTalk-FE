"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
} from "@/components/ui/select";
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useMyPaymentHistory,
  useUploadAvatar,
  useDeleteAvatar,
} from "@/features/profile/hooks";
import { useMyDashboard } from "@/features/dashboard/hooks";
import { isPro, type UserProfile } from "@/services/user.service";
import { UpgradeProDialog } from "@/components/layouts/sidebar/upgrade-pro-dialog";
import { cn } from "@/lib/utils/cn";
import {
  User,
  Crown,
  Lock,
  Coins,
  Calendar,
  Phone,
  MapPin,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  Hourglass,
  Sparkles,
  Camera,
  Trash2,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type TabKey = "profile" | "billing" | "security";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "profile", label: "Hồ sơ cá nhân", icon: User },
  { key: "billing", label: "Gói & Token", icon: Crown },
  { key: "security", label: "Bảo mật", icon: Lock },
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

function formatRemainingTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "Đã hết hạn";

  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `Còn ${diffDays} ngày`;

  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;
  return days > 0 ? `Còn ${months} tháng ${days} ngày` : `Còn ${months} tháng`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeGender(value: string | null | undefined): "MALE" | "FEMALE" | "OTHER" | "" {
  if (!value) return "";
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();

  if (["MALE", "M", "NAM", "BOY"].includes(normalized)) return "MALE";
  if (["FEMALE", "F", "NU", "GIRL", "WOMAN"].includes(normalized)) return "FEMALE";
  if (["OTHER", "O", "KHAC", "NON_BINARY", "NONBINARY"].includes(normalized)) return "OTHER";
  return "";
}

const GENDER_LABELS: Record<"MALE" | "FEMALE" | "OTHER", string> = {
  MALE: "Nam",
  FEMALE: "N\u1eef",
  OTHER: "Kh\u00e1c",
};

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    PAID: { label: "Thành công", color: "#22c55e", icon: CheckCircle },
    PENDING: { label: "Chờ thanh toán", color: "#f59e0b", icon: Clock },
    CANCELLED: { label: "Đã hủy", color: "#ef4444", icon: XCircle },
    EXPIRED: { label: "Hết hạn", color: "#6b7280", icon: XCircle },
  };
  const cfg = map[status] ?? { label: status, color: "#6b7280", icon: Clock };
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

  if (isLoading || !profile) return <ProfileSkeleton />;

  // key remounts the form (fresh initial state) whenever the loaded account changes
  return <PersonalProfileForm key={profile.uid} profile={profile} />;
}

function PersonalProfileForm({ profile }: { profile: UserProfile }) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
  const { mutate: deleteAvatar, isPending: isDeletingAvatar } = useDeleteAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: profile.fullName ?? "",
    userName: profile.userName ?? "",
    phoneNumber: profile.phoneNumber ?? "",
    address: profile.address ?? "",
    dob: profile.dob ? profile.dob.slice(0, 10) : "",
    gender: normalizeGender(profile.gender),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName: form.fullName || undefined,
      userName: form.userName || undefined,
      phoneNumber: form.phoneNumber || undefined,
      address: form.address || undefined,
      dob: form.dob || undefined,
      gender: normalizeGender(form.gender) || undefined,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh (JPEG, PNG, WEBP, GIF)");
      return;
    }
    uploadAvatar({ userId: profile.uid, file });
  };

  const isAvatarBusy = isUploadingAvatar || isDeletingAvatar;

  const initials = (profile.userName ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border p-5 lg:sticky lg:top-6 lg:self-start bg-[linear-gradient(180deg,var(--bg-main)_0%,var(--bg-elevated)_100%)] border-border-default">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar
              className={cn(
                "w-24 h-24 border-2 shadow-sm",
                isPro(profile ?? null) ? "border-accent-gold" : "border-border-strong"
              )}
            >
              <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.userName} />
              <AvatarFallback className="text-2xl font-bold bg-[linear-gradient(135deg,var(--accent-gold)_0%,var(--truffle)_100%)] text-bg-deep">
                {initials}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isAvatarBusy}
              title="Đổi ảnh đại diện"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60 bg-[linear-gradient(135deg,var(--accent-gold)_0%,var(--truffle)_100%)] border-bg-elevated"
            >
              <Camera className="h-4 w-4 text-text-inverse" />
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {profile?.avatarUrl && (
            <button
              type="button"
              onClick={() => deleteAvatar(profile.uid)}
              disabled={isAvatarBusy}
              className="mt-2 flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-60 text-accent-danger"
            >
              <Trash2 className="h-3 w-3" />
              Xóa ảnh đại diện
            </button>
          )}

          <p className="mt-4 text-lg font-bold text-text-primary">
            {profile?.fullName || profile?.userName || "—"}
          </p>
          <p className="mt-1 max-w-full truncate text-sm text-text-muted">
            {profile?.email}
          </p>

          {isPro(profile ?? null) ? (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold bg-[linear-gradient(90deg,rgba(201,162,77,0.18),rgba(163,81,57,0.12))] text-accent-gold border border-[rgba(201,162,77,0.3)]">
              <Crown className="w-3.5 h-3.5 fill-current" />
              {profile?.tierTitle}
            </span>
          ) : (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold bg-bg-elevated text-text-muted border border-border-default">
              <Sparkles className="w-3.5 h-3.5" />
              Tài khoản cơ bản
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 text-center">
          <ProfileMiniStat label="Token" value={(profile?.token ?? 0).toLocaleString("vi-VN")} />
          <ProfileMiniStat label="Ngày tham gia" value={formatDate(profile?.createdAt)} />
        </div>
      </aside>

      <div className="space-y-6">
        <section>
          <div className="mb-4">
            <h2 className="text-base font-bold text-text-primary">
              Thông tin cá nhân
            </h2>
            <p className="text-sm text-text-muted">
              Cập nhật tên hiển thị và thông tin liên hệ của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Họ và tên"
              icon={User}
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
              placeholder="Nguyễn Văn A"
            />
            <FormField
              label="Tên người dùng"
              icon={User}
              value={form.userName}
              onChange={(v) => setForm({ ...form, userName: v })}
              placeholder="nguyenvana"
            />
            <FormField
              label="Email"
              icon={Mail}
              value={profile?.email ?? ""}
              onChange={() => {}}
              disabled
              placeholder="email@example.com"
            />
            <FormField
              label="Số điện thoại"
              icon={Phone}
              value={form.phoneNumber}
              onChange={(v) => setForm({ ...form, phoneNumber: v })}
              placeholder="0901234567"
              type="tel"
            />
            <FormField
              label="Ngày sinh"
              icon={Calendar}
              value={form.dob}
              onChange={(v) => setForm({ ...form, dob: v })}
              placeholder=""
              type="date"
            />

            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5 text-text-secondary">
                <User className="w-3.5 h-3.5" />
                Giới tính
              </Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: normalizeGender(v) })}
              >
                <SelectTrigger className="h-10 border text-sm bg-bg-elevated border-border-default text-text-primary rounded-[10px]">
                  <span data-slot="select-value" className="line-clamp-1">
                    {form.gender ? (
                      GENDER_LABELS[form.gender as "MALE" | "FEMALE" | "OTHER"]
                    ) : (
                      <span className="text-text-muted">Chọn giới tính</span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start">
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section>

          <div className="grid grid-cols-1">
            <FormField
              label="Địa chỉ"
              icon={MapPin}
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              placeholder="123 Lê Lợi, Quận 1, TP.HCM"
            />
          </div>
        </section>

        <div className="flex justify-end border-t pt-5 border-border-default">
        <Button
          type="submit"
          disabled={isPending}
          className={cn(
            "gap-2 px-6 font-semibold bg-[linear-gradient(135deg,var(--accent-gold)_0%,var(--truffle)_100%)] text-text-inverse rounded-[10px] shadow-[0_2px_10px_var(--accent-gold-glow,rgba(201,162,77,0.35))]",
            isPending && "opacity-70"
          )}
        >
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
        </div>
      </div>
    </form>
  );
}

function ProfileMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border px-3 py-2 bg-bg-elevated border-border-default">
      <p className="truncate text-sm font-bold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-text-muted">
        {label}
      </p>
    </div>
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
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium flex items-center gap-1.5 text-text-secondary">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-10 border text-sm rounded-[10px] border-border-default",
          disabled
            ? "bg-bg-main text-text-muted opacity-70"
            : "bg-bg-elevated text-text-primary"
        )}
      />
    </div>
  );
}

// ── Tab 2: Billing & Token ───────────────────
function BillingTab() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: payments, isLoading: paymentsLoading } = useMyPaymentHistory();
  const { data: dashboard, isLoading: dashboardLoading } = useMyDashboard();
  const proUser = isPro(profile ?? null);
  const aiUsage = dashboard?.aiUsage;

  return (
    <div className="space-y-6">
      {/* Current Tier Card */}
      <div
        className={cn(
          "rounded-2xl p-5 border relative overflow-hidden",
          proUser
            ? "bg-[linear-gradient(135deg,rgba(201,162,77,0.14)_0%,rgba(163,81,57,0.10)_100%)] border-[rgba(201,162,77,0.4)] shadow-[0_4px_20px_rgba(201,162,77,0.1)]"
            : "bg-bg-elevated border-border-default"
        )}
      >
        {proUser && (
          <div className="absolute top-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,162,77,0.7),transparent)]" />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                proUser
                  ? "bg-[linear-gradient(135deg,var(--accent-gold)_0%,var(--truffle)_100%)] shadow-[0_2px_12px_var(--accent-gold-glow,rgba(201,162,77,0.4))]"
                  : "bg-bg-main border border-border-default"
              )}
            >
              <Crown
                className={cn("w-5 h-5", proUser ? "fill-current text-text-inverse" : "text-text-muted")}
              />
            </div>
            <div>
              <p className="font-bold text-base text-text-primary">
                {profile?.tierTitle ?? "Gói miễn phí"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {proUser ? (
              <Badge className="font-bold text-[10px] px-2 py-1 border-0 bg-accent-gold/15 text-accent-gold">
                ✦ PRO
              </Badge>
            ) : (
              <Badge className="font-bold text-[10px] px-2 py-1 bg-bg-main text-text-muted border border-border-default">
                Free
              </Badge>
            )}
            <UpgradeProDialog>
              <button
                type="button"
                className="text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-90 bg-[linear-gradient(135deg,var(--accent-gold)_0%,var(--truffle)_100%)] text-text-inverse shadow-[0_2px_8px_rgba(201,162,77,0.35)]"
              >
                {proUser ? "Đổi gói" : "Nâng cấp ngay"}
              </button>
            </UpgradeProDialog>
          </div>
        </div>

        {/* Token display */}
        {profileLoading ? (
          <Skeleton className="h-14 w-full mt-4 rounded-xl" />
        ) : (
          <div className="mt-4 rounded-xl p-4 flex items-center gap-3 bg-bg-main border border-border-default">
            <Coins
              className={cn("w-8 h-8 shrink-0", proUser ? "text-accent-gold" : "text-text-muted")}
            />
            <div>
              <p className="text-2xl font-extrabold tabular-nums text-text-primary">
                {(profile?.token ?? 0).toLocaleString("vi-VN")}
              </p>
              <p className="text-xs font-medium text-text-muted">
                Token AI còn lại
              </p>
            </div>
          </div>
        )}

        {/* Subscription end time display */}
        {profileLoading ? (
          <Skeleton className="h-14 w-full mt-3 rounded-xl" />
        ) : profile?.subscriptionEndTime && (
          <div
            className={cn(
              "mt-3 rounded-xl p-4 flex items-center gap-3",
              proUser
                ? "bg-[linear-gradient(135deg,rgba(201,162,77,0.08)_0%,rgba(163,81,57,0.05)_100%)] border border-[rgba(201,162,77,0.3)]"
                : "bg-bg-main border border-border-default"
            )}
          >
            <Hourglass
              className={cn("w-8 h-8 shrink-0", proUser ? "text-accent-gold" : "text-text-muted")}
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold tabular-nums text-text-primary">
                  {formatDate(profile.subscriptionEndTime)}
                </p>
                {formatRemainingTime(profile.subscriptionEndTime) && (
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-1.5 py-0.5 rounded-full",
                      proUser ? "bg-accent-gold/15 text-accent-gold" : "bg-bg-elevated text-text-muted"
                    )}
                  >
                    {formatRemainingTime(profile.subscriptionEndTime)}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-text-muted">
                Ngày hết hạn gói
              </p>
            </div>
          </div>
        )}

        {/* Token usage breakdown */}
        {dashboardLoading ? (
          <Skeleton className="h-20 w-full mt-3 rounded-xl" />
        ) : aiUsage && aiUsage.totalTokensUsed > 0 && (
          <div className="mt-3 rounded-xl p-4 bg-bg-main border border-border-default">
            <p className="text-xs font-semibold mb-3 text-text-secondary">
              Chi tiết sử dụng token
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-base font-bold tabular-nums text-text-primary">
                  {aiUsage.totalTokensUsed.toLocaleString("vi-VN")}
                </p>
                <p className="text-[11px] text-text-muted">
                  Tổng đã dùng
                </p>
              </div>
              <div>
                <p className="text-base font-bold tabular-nums text-text-primary">
                  {aiUsage.promptTokens.toLocaleString("vi-VN")}
                </p>
                <p className="text-[11px] text-text-muted">
                  Prompt (đầu vào)
                </p>
              </div>
              <div>
                <p className="text-base font-bold tabular-nums text-text-primary">
                  {aiUsage.completionTokens.toLocaleString("vi-VN")}
                </p>
                <p className="text-[11px] text-text-muted">
                  Completion (đầu ra)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top characters mini card */}
        {!dashboardLoading && aiUsage && aiUsage.topCharacters.length > 0 && (
          <div className="mt-3 rounded-xl p-4 bg-bg-main border border-border-default">
            <p className="text-xs font-semibold mb-3 text-text-secondary">
              Nhân vật tương tác nhiều nhất
            </p>
            <div className="space-y-2.5">
              {aiUsage.topCharacters.slice(0, 3).map((character) => (
                <div key={character.characterId} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-bg-elevated text-text-muted">
                      {character.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-text-primary">
                      {character.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {character.messageCount} tin nhắn
                    </p>
                  </div>
                  <span className="text-xs font-semibold shrink-0 text-text-muted">
                    {character.tokenUsed.toLocaleString("vi-VN")} token
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h3 className="text-sm font-bold mb-3 text-text-secondary">
          Lịch sử giao dịch
        </h3>

        {paymentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="rounded-xl p-8 text-center border bg-bg-elevated border-border-default">
            <Coins className="w-10 h-10 mx-auto mb-2 text-text-muted" />
            <p className="text-sm text-text-muted">
              Chưa có giao dịch nào
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.orderId}
                className="rounded-xl p-4 border flex items-center justify-between gap-4 bg-bg-elevated border-border-default"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border-default",
                      p.status === "PAID" ? "bg-[rgba(34,197,94,0.12)]" : "bg-bg-main"
                    )}
                  >
                    <Crown
                      className={cn("w-4 h-4 fill-current", p.status === "PAID" ? "text-[#22c55e]" : "text-text-muted")}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-text-primary">
                      {p.tierTitle}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDate(p.paidAt ?? p.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold text-text-primary">
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
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

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
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
      <div className="rounded-xl p-4 border text-sm flex items-start gap-2 bg-[rgba(139,179,200,0.08)] border-[rgba(139,179,200,0.25)] text-[var(--accent-blue,#8fb3c8)]">
        <Lock className="w-4 h-4 mt-0.5 shrink-0 fill-current" />
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
              className="text-sm font-medium flex items-center gap-1.5 text-text-secondary"
            >
              <Lock className="w-3.5 h-3.5" />
              {labels[field]}
            </Label>
            <div className="relative">
              <Input
                id={field}
                type={showPassword[field] ? "text" : "password"}
                value={form[field]}
                onChange={(e) => {
                  setForm({ ...form, [field]: e.target.value });
                  if (errors[field]) setErrors({ ...errors, [field]: "" });
                }}
                placeholder="••••••••"
                className={cn(
                  "h-10 border text-sm pr-10 bg-bg-elevated text-text-primary rounded-[10px]",
                  errors[field] ? "border-accent-danger" : "border-border-default"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, [field]: !showPassword[field] })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors text-text-muted"
              >
                {showPassword[field] ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors[field] && (
              <p className="text-xs text-accent-danger">
                {errors[field]}
              </p>
            )}
          </div>
        );
      })}

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full font-semibold bg-[linear-gradient(135deg,var(--accent-gold)_0%,var(--truffle)_100%)] text-text-inverse rounded-[10px] shadow-[0_2px_10px_var(--accent-gold-glow,rgba(201,162,77,0.35))]",
          isPending && "opacity-70"
        )}
      >
        {isPending ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </Button>

      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold transition-colors hover:underline text-accent-gold"
        >
          Quên mật khẩu?
        </Link>
      </div>
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
  const { data: profile } = useProfile();
  const proUser = isPro(profile ?? null);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/profile?tab=${key}`, { scroll: false });
  };

  return (
    <div className="px-3 py-6 md:px-6 md:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-title text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
              {proUser && (
                <span className="inline-flex items-center mr-2 align-middle text-accent-gold">
                  ✦
                </span>
              )}
              Hồ sơ của tôi
            </h1>
            <p className="text-sm mt-1 text-text-muted">
              Quản lý thông tin tài khoản & gói dịch vụ
            </p>
          </div>

          {proUser && profile?.tierTitle && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[linear-gradient(135deg,rgba(201,162,77,0.18),rgba(163,81,57,0.12))] text-accent-gold border border-[rgba(201,162,77,0.35)] shadow-[0_2px_10px_rgba(201,162,77,0.12)]">
              <Crown className="w-3.5 h-3.5 fill-current" />
              {profile.tierTitle}
            </div>
          )}
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 p-1 rounded-2xl border bg-bg-elevated border-border-default">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border border-transparent",
                  isActive
                    ? key === "billing" && proUser
                      ? "bg-[linear-gradient(135deg,rgba(201,162,77,0.22),rgba(163,81,57,0.15))] text-accent-gold shadow-[0_2px_8px_rgba(0,0,0,0.12)] border-[rgba(201,162,77,0.3)]"
                      : "bg-bg-main text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                    : "bg-transparent text-text-muted"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "fill-current")} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="rounded-2xl border p-6 bg-bg-elevated border-border-default shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          {activeTab === "profile" && <PersonalProfileTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

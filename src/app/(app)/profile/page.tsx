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
import { ArchiveHeading } from "@/components/commons/archive-heading";
import { SchoolQuotaCard } from "@/components/saas/school-quota-card";
import { useAuthStore } from "@/store/auth.store";
import { useEntitlements } from "@/features/saas/entitlements";
import { useTodayQuota } from "@/features/saas/quota-bonus";
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
  School,
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
  const map: Record<string, { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }> = {
    PAID: {
      label: "Thành công",
      classes: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
      icon: CheckCircle,
    },
    PENDING: {
      label: "Chờ thanh toán",
      classes: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
      icon: Clock,
    },
    CANCELLED: {
      label: "Đã hủy",
      classes: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
      icon: XCircle,
    },
    EXPIRED: {
      label: "Hết hạn",
      classes: "border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[var(--text-tertiary)]",
      icon: XCircle,
    },
  };
  const cfg = map[status] ?? {
    label: status,
    classes: "border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)] text-[var(--text-tertiary)]",
    icon: Clock,
  };
  const IconEl = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-[2px] border px-2 text-[10px] font-bold uppercase tracking-[0.1em]",
        cfg.classes
      )}
    >
      <IconEl className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

const FIELD_LABEL =
  "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary";
const FIELD_INPUT = "h-10 rounded-[2px] border text-sm focus-visible:border-[var(--text-primary)]";
const CRIMSON_SUBMIT =
  "h-[42px] gap-2 rounded-[2px] px-6 text-[13px] font-bold uppercase tracking-[0.08em] bg-[var(--accent-gold)] text-[#FFFFFF] hover:bg-[var(--accent-bronze)]";

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-[2px]" />
          <Skeleton className="h-4 w-24 rounded-[2px]" />
        </div>
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-20 rounded-[2px]" />
          <Skeleton className="h-10 w-full rounded-[2px]" />
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
  // School accounts show the school package and today's quota instead of a personal tier / wallet.
  const entitlements = useEntitlements();
  const isSchoolAccount = entitlements.mode === "B2B";
  const todayQuota = useTodayQuota();
  const proUser = !isSchoolAccount && isPro(profile ?? null);

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
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
      <aside className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-elevated)] lg:sticky lg:top-6 lg:self-start">
        <div className="border-b border-[var(--text-primary)] px-4 py-2">
        </div>

        <div className="flex flex-col items-center p-5 text-center">
          <div className="relative">
            <Avatar
              className={cn(
                "w-24 h-24 border-2",
                proUser ? "border-accent-gold" : "border-[var(--text-primary)]"
              )}
            >
              <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.userName} />
              <AvatarFallback className="font-display text-3xl font-extrabold bg-[var(--text-primary)] text-text-inverse">
                {initials}
              </AvatarFallback>
            </Avatar>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isAvatarBusy}
              title="Đổi ảnh đại diện"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-[2px] border-2 border-[var(--bg-elevated)] bg-[var(--accent-gold)] transition-colors hover:bg-[var(--accent-bronze)] disabled:opacity-60"
            >
              <Camera className="h-4 w-4 text-[#FFFFFF]" />
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
              className="mt-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-80 disabled:opacity-60 text-accent-danger"
            >
              <Trash2 className="h-3 w-3" />
              Xóa ảnh đại diện
            </button>
          )}

          <p className="archive-title is-plain mt-4 max-w-full text-[22px]">
            {profile?.fullName || profile?.userName || "—"}
          </p>
          <p className="mt-1 max-w-full truncate text-sm text-text-tertiary">
            {profile?.email}
          </p>

          {isSchoolAccount ? (
            <span className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-[2px] border border-[var(--border-strong)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-secondary">
              <School className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Gói của trường: {entitlements.planLabel}</span>
            </span>
          ) : proUser ? (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-[var(--accent-gold)] text-[#FFFFFF]">
              <Crown className="w-3.5 h-3.5 fill-current" />
              {profile?.tierTitle}
            </span>
          ) : (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--border-strong)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              <Sparkles className="w-3.5 h-3.5" />
              Tài khoản cơ bản
            </span>
          )}
        </div>

        <dl className="grid grid-cols-2 border-t border-[var(--text-primary)] text-center">
          {isSchoolAccount ? (
            <ProfileMiniStat
              label="Hạn mức hôm nay"
              value={
                todayQuota
                  ? `${todayQuota.used.toLocaleString("vi-VN")} / ${todayQuota.quota.toLocaleString("vi-VN")}`
                  : "—"
              }
            />
          ) : (
            <ProfileMiniStat label="Token" value={(profile?.token ?? 0).toLocaleString("vi-VN")} />
          )}
          <ProfileMiniStat
            label="Ngày tham gia"
            value={formatDate(profile?.createdAt)}
            className="border-l border-[var(--border-default)]"
          />
        </dl>
      </aside>

      <div className="space-y-6">
        <section>
          <ArchiveHeading
            label="Hồ sơ"
            title="Thông tin cá nhân"
            description="Cập nhật tên hiển thị và thông tin liên hệ của bạn."
          />

          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
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

            <div className="space-y-1.5 border-b border-[var(--border-default)] py-4">
              <Label className={FIELD_LABEL}>
                <User className="w-3.5 h-3.5" />
                Giới tính
              </Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm({ ...form, gender: normalizeGender(v) })}
              >
                <SelectTrigger className="h-10 rounded-[2px] border text-sm bg-bg-main border-border-strong text-text-primary">
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

        <div className="flex justify-end border-t border-[var(--text-primary)] pt-5">
          <Button
            type="submit"
            disabled={isPending}
            className={cn(CRIMSON_SUBMIT, isPending && "opacity-70")}
          >
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ProfileMiniStat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("min-w-0 px-3 py-3", className)}>
      <dd className="truncate font-display text-lg font-extrabold leading-tight tabular-nums text-text-primary">
        {value}
      </dd>
      <dt className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
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
    <div className="space-y-1.5 border-b border-[var(--border-default)] py-4">
      <Label className={FIELD_LABEL}>
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
          FIELD_INPUT,
          disabled
            ? "border-border-default bg-bg-elevated text-text-muted opacity-70"
            : "border-border-strong bg-bg-main text-text-primary"
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
    <div className="space-y-8">
      {/* Current Tier Card */}
      <div
        className={cn(
          "rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]",
          proUser && "border-t-[3px] border-t-[var(--accent-gold)]"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--text-primary)] p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-[2px] flex items-center justify-center shrink-0",
                proUser
                  ? "bg-[var(--accent-gold)]"
                  : "border border-[var(--border-strong)]"
              )}
            >
              <Crown
                className={cn("w-5 h-5", proUser ? "fill-current text-[#FFFFFF]" : "text-text-muted")}
              />
            </div>
            <div>
              <p className="archive-title is-plain mt-0.5 text-[20px]">
                {profile?.tierTitle ?? "Gói miễn phí"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {proUser ? (
              <Badge className="rounded-[2px] font-bold uppercase tracking-[0.1em] text-[10px] px-2 py-1 border-0 bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]">
                ✦ PRO
              </Badge>
            ) : (
              <Badge className="rounded-[2px] font-bold uppercase tracking-[0.1em] text-[10px] px-2 py-1 bg-transparent text-text-tertiary border border-border-strong">
                Free
              </Badge>
            )}
            <UpgradeProDialog>
              <button
                type="button"
                className="btn-crimson min-h-[34px] cursor-pointer whitespace-nowrap px-3 text-[11px]"
              >
                {proUser ? "Đổi gói" : "Nâng cấp ngay"}
              </button>
            </UpgradeProDialog>
          </div>
        </div>

        <div className="grid sm:grid-cols-2">
          {/* Token display */}
          {profileLoading ? (
            <Skeleton className="m-5 h-14 rounded-[2px]" />
          ) : (
            <div className="flex items-center gap-3 p-5">
              <Coins
                className={cn("w-7 h-7 shrink-0", proUser ? "text-accent-gold" : "text-text-muted")}
              />
              <div>
                <p className="font-display text-3xl font-extrabold leading-none tabular-nums text-text-primary">
                  {(profile?.token ?? 0).toLocaleString("vi-VN")}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                  Token AI còn lại
                </p>
              </div>
            </div>
          )}

          {/* Subscription end time display */}
          {profileLoading ? (
            <Skeleton className="m-5 h-14 rounded-[2px]" />
          ) : profile?.subscriptionEndTime && (
            <div className="flex items-center gap-3 border-t border-[var(--border-default)] p-5 sm:border-l sm:border-t-0">
              <Hourglass
                className={cn("w-7 h-7 shrink-0", proUser ? "text-accent-gold" : "text-text-muted")}
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-2xl font-extrabold leading-none tabular-nums text-text-primary">
                    {formatDate(profile.subscriptionEndTime)}
                  </p>
                  {formatRemainingTime(profile.subscriptionEndTime) && (
                    <span
                      className={cn(
                        "rounded-[2px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
                        proUser
                          ? "bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]"
                          : "border border-border-default text-text-tertiary"
                      )}
                    >
                      {formatRemainingTime(profile.subscriptionEndTime)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                  Ngày hết hạn gói
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Token usage breakdown */}
        {dashboardLoading ? (
          <Skeleton className="mx-5 mb-5 h-20 rounded-[2px]" />
        ) : aiUsage && aiUsage.totalTokensUsed > 0 && (
          <div className="border-t border-[var(--border-default)] px-5 py-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
              Chi tiết sử dụng token
            </p>
            <div className="grid grid-cols-3 border border-[var(--border-strong)] text-center">
              {[
                { value: aiUsage.totalTokensUsed, label: "Tổng đã dùng" },
                { value: aiUsage.promptTokens, label: "Prompt (đầu vào)" },
                { value: aiUsage.completionTokens, label: "Completion (đầu ra)" },
              ].map((cell, i) => (
                <div
                  key={cell.label}
                  className={cn("px-2 py-3", i > 0 && "border-l border-[var(--border-default)]")}
                >
                  <p className="font-display text-lg font-extrabold tabular-nums text-text-primary">
                    {cell.value.toLocaleString("vi-VN")}
                  </p>
                  <p className="text-[11px] text-text-tertiary">
                    {cell.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top characters mini card */}
        {!dashboardLoading && aiUsage && aiUsage.topCharacters.length > 0 && (
          <div className="border-t border-[var(--border-default)] px-5 py-4">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
              Nhân vật tương tác nhiều nhất
            </p>
            <div className="divide-y divide-[var(--border-default)]">
              {aiUsage.topCharacters.slice(0, 3).map((character) => (
                <div key={character.characterId} className="flex items-center gap-3 py-2.5">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-bg-elevated text-text-tertiary">
                      {character.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-text-primary">
                      {character.name}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {character.messageCount} tin nhắn
                    </p>
                  </div>
                  <span className="font-display text-sm font-extrabold shrink-0 tabular-nums text-text-secondary">
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
        <ArchiveHeading label="Thanh toán" title="Lịch sử giao dịch" className="mb-0 border-b-0" />

        {paymentsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-[2px]" />
            ))}
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="rounded-[2px] border border-dashed border-border-strong p-8 text-center">
            <Coins className="w-10 h-10 mx-auto mb-2 text-text-muted" />
            <p className="text-sm text-text-tertiary">
              Chưa có giao dịch nào
            </p>
          </div>
        ) : (
          <div className="rounded-[2px] border border-[var(--text-primary)]">
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_140px] gap-4 border-b border-[var(--text-primary)] bg-bg-elevated px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary sm:grid">
              <span>Gói</span>
              <span>Trạng thái</span>
              <span className="text-right">Số tiền</span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {payments.map((p) => (
                <div
                  key={p.orderId}
                  className="flex items-center justify-between gap-4 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_150px_140px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-[2px] flex items-center justify-center shrink-0 border",
                        p.status === "PAID"
                          ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)]"
                          : "border-border-default"
                      )}
                    >
                      <Crown
                        className={cn(
                          "w-4 h-4 fill-current",
                          p.status === "PAID" ? "text-[var(--status-success)]" : "text-text-muted"
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-text-primary">
                        {p.tierTitle}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {formatDate(p.paidAt ?? p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block">{statusBadge(p.status)}</div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-display text-lg font-extrabold leading-none tabular-nums text-text-primary">
                      {formatCurrency(p.amount)}
                    </span>
                    <span className="sm:hidden">{statusBadge(p.status)}</span>
                  </div>
                </div>
              ))}
            </div>
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
    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
      <ArchiveHeading label="Bảo mật" title="Đổi mật khẩu" />

      <div className="flex items-start gap-2 border-[var(--text-primary)] bg-bg-elevated px-4 py-3 text-sm text-text-secondary">
        <Lock className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Để bảo vệ tài khoản, mật khẩu mới phải có ít nhất 8 ký tự và khác mật khẩu hiện tại.</span>
      </div>

      {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => {
        const labels: Record<string, string> = {
          currentPassword: "Mật khẩu hiện tại",
          newPassword: "Mật khẩu mới",
          confirmPassword: "Xác nhận mật khẩu mới",
        };
        return (
          <div key={field} className="space-y-1.5 border-b border-[var(--border-default)] py-4">
            <Label htmlFor={field} className={FIELD_LABEL}>
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
                  FIELD_INPUT,
                  "pr-10 bg-bg-main text-text-primary",
                  errors[field] ? "border-accent-danger" : "border-border-strong"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, [field]: !showPassword[field] })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-[2px] transition-colors text-text-muted hover:text-text-primary"
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
        className={cn("mt-6 w-full", CRIMSON_SUBMIT, isPending && "opacity-70")}
      >
        {isPending ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
      </Button>

      <div className="mt-5 text-center">
        <Link href="/forgot-password" className="archive-link">
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
  const role = useAuthStore((s) => s.user?.role);
  // Teacher / School Student get tokens from the school's daily quota: no plans to buy (Role Matrix row 26).
  const { canPurchase } = useEntitlements();
  const schoolAccount = !canPurchase;
  const proUser = !schoolAccount && isPro(profile ?? null);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`/profile?tab=${key}`, { scroll: false });
  };

  return (
    <div className="px-3 py-6 md:px-6 md:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Page Header ── */}
        <div className="relative">
          <ArchiveHeading
            as="h1"
            label="Tài khoản"
            title="Hồ sơ của tôi"
            description="Quản lý thông tin tài khoản & gói dịch vụ"
            className="mb-0 pr-20 sm:pr-64"
          />

          <div className="absolute bottom-3 right-0 flex items-end gap-4">
            {proUser && profile?.tierTitle && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-[2px] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] bg-[var(--accent-gold)] text-[#FFFFFF]">
                <Crown className="w-3.5 h-3.5 fill-current" />
                {profile.tierTitle}
              </div>
            )}
            <span className="archive-seal h-[52px] w-[52px] text-[17px]" aria-hidden="true">國史</span>
          </div>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex rounded-[2px] border border-[var(--text-primary)] bg-bg-surface">
          {TABS.map(({ key, label, icon: Icon }, i) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition-colors duration-200",
                  i > 0 && "border-l border-[var(--text-primary)]",
                  isActive
                    ? key === "billing" && proUser
                      ? "bg-[var(--accent-gold)] text-[#FFFFFF]"
                      : "bg-[var(--text-primary)] text-text-inverse"
                    : "bg-transparent text-text-tertiary hover:bg-bg-elevated hover:text-text-primary"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{key === "billing" && schoolAccount ? "Hạn mức token" : label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="rounded-[2px] border border-[var(--text-primary)] bg-bg-surface p-5 sm:p-6">
          {activeTab === "profile" && <PersonalProfileTab />}
          {activeTab === "billing" && (schoolAccount ? <SchoolQuotaCard role={role} /> : <BillingTab />)}
          {activeTab === "security" && <SecurityTab />}
        </div>
      </div>
    </div>
  );
}

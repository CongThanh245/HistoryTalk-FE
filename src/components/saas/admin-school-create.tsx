"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { StaffFormInput } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { CredentialsDialog } from "@/components/saas/accounts-credentials";
import { todayStamp, type CredentialRecord } from "@/components/saas/accounts-utils";
import {
  AdminAccountFields,
  LOOSE_PHONE_PATTERN,
  adminAccountErrors,
  compactPhone,
  emptyAdminAccount,
  focusById,
  type AdminAccountValues,
} from "@/components/saas/admin-school-shared";
import { Field, Panel, SectionHeading, formatNumber, isValidEmail } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useCreateApiSchool, useCreateApiSchoolAdmin } from "@/features/saas/hooks-api";
import {
  SCHOOL_CODE_PATTERN,
  PACKAGE_ORDER,
  PACKAGE_SHORT_LABELS,
  adminCredentialRecord,
  codeSlug,
  millionTokens,
  schoolAdminCreateError,
  schoolCreateError,
  type AdminFormField,
  type SchoolFormField,
} from "@/features/saas/admin-schools";
import { ENTERPRISE_PACKAGE_TOKENS, type ApiSchool, type EnterprisePackage } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

const PACKAGE_HINTS: Record<EnterprisePackage, string> = {
  ENTERPRISE_SMALL: "Trường nhỏ, vài lớp dùng thử.",
  ENTERPRISE_MEDIUM: "Phù hợp phần lớn trường THCS/THPT.",
  ENTERPRISE_LARGE: "Trường lớn, nhiều khối lớp dùng thường xuyên.",
};

const emptySchool = () => ({
  name: "",
  schoolCode: "",
  address: "",
  contactEmail: "",
  contactPhone: "",
  packageType: "ENTERPRISE_SMALL" as EnterprisePackage,
  localHistoryPolicyAccepted: false,
});
type SchoolForm = ReturnType<typeof emptySchool>;

const ID = (f: SchoolFormField) => `lcs-${f}`;
const ADMIN_PREFIX = "lcs-admin";

function schoolErrors(f: SchoolForm): Record<SchoolFormField, string | null> {
  const name = f.name.trim();
  const code = f.schoolCode.trim();
  return {
    name: !name ? "Nhập tên trường" : name.length < 3 ? "Tên trường tối thiểu 3 ký tự" : null,
    schoolCode: code && !SCHOOL_CODE_PATTERN.test(code) ? "2–30 ký tự: chữ không dấu, số, dấu gạch ngang (-) hoặc gạch dưới (_)" : null,
    address: null,
    contactEmail: !f.contactEmail.trim() ? "Nhập email liên hệ" : isValidEmail(f.contactEmail) ? null : "Email không hợp lệ",
    contactPhone: f.contactPhone.trim() && !LOOSE_PHONE_PATTERN.test(f.contactPhone.trim()) ? "Số điện thoại không hợp lệ" : null,
    packageType: null,
    localHistoryPolicyAccepted: f.localHistoryPolicyAccepted ? null : "Cần xác nhận cam kết để tạo trường",
  };
}

const STEPS = ["Thông tin trường", "Quản trị trường"] as const;

function StepIndicator({ step }: { step: 0 | 1 }) {
  return (
    <ol className="grid grid-cols-2 border border-[var(--text-primary)]" aria-label="Các bước tạo trường">
      {STEPS.map((label, i) => {
        const current = i === step;
        const done = i < step;
        return (
          <li
            key={label}
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-2 px-3 py-2 text-xs font-bold",
              i > 0 && "border-l border-[var(--text-primary)]",
              current ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" : "text-[var(--text-secondary)]",
            )}
          >
            <span
              className={cn(
                "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border text-[11px] tabular-nums",
                current ? "border-[var(--text-inverse)]" : "border-[var(--border-strong)]",
                done && "border-[var(--status-success)] text-[var(--status-success)]",
              )}
            >
              {done ? <Check className="h-3 w-3" aria-hidden="true" /> : i + 1}
            </span>
            <span className="truncate">{label}</span>
            {done && <span className="sr-only">(đã xong)</span>}
          </li>
        );
      })}
    </ol>
  );
}

const hasErrors = (e: Record<string, string | null>) => Object.values(e).some(Boolean);

/**
 * "Thêm trường" page (`/staff/admin/schools/new`): step 1 `POST /admin/schools`, step 2 `POST /admin/school-admins`.
 * A full page rather than a dialog so the long form never scrolls inside a popup; the action bar sticks to the bottom.
 * The school is saved as soon as step 1 succeeds; if step 2 fails the user can retry or finish later
 * from the school page. The backend generates the admin's userName and initial password, shown once.
 */
export function CreateSchoolForm() {
  const router = useRouter();
  const createSchool = useCreateApiSchool();
  const createAdmin = useCreateApiSchoolAdmin();

  const [form, setForm] = React.useState(emptySchool);
  const [admin, setAdmin] = React.useState<AdminAccountValues>(emptyAdminAccount);
  const [touched, setTouched] = React.useState<[boolean, boolean]>([false, false]);
  const [serverErrors1, setServerErrors1] = React.useState<Partial<Record<SchoolFormField, string>>>({});
  const [serverErrors2, setServerErrors2] = React.useState<Partial<Record<AdminFormField, string>>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [school, setSchool] = React.useState<ApiSchool | null>(null);
  const [credentials, setCredentials] = React.useState<{ school: ApiSchool; record: CredentialRecord } | null>(null);

  const step: 0 | 1 = school ? 1 : 0;
  const busy = createSchool.isPending || createAdmin.isPending;

  const errors1 = schoolErrors(form);
  const errors2 = adminAccountErrors(admin);
  const e1 = (k: SchoolFormField) => serverErrors1[k] ?? (touched[0] ? errors1[k] : null);
  const e2 = (k: AdminFormField) => serverErrors2[k] ?? (touched[1] ? errors2[k] : null);

  const set = <K extends keyof SchoolForm>(key: K, value: SchoolForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setServerErrors1((s) => ({ ...s, [key]: undefined }));
  };

  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#create-school-form [aria-invalid='true']")?.focus();
    });
  }

  /** Leaving after the school exists goes to its page, where the admin can be added later. */
  function close() {
    if (busy) return;
    if (school) {
      toast.info(`Đã lưu ${school.name}. Bạn có thể thêm quản trị trường sau ở trang của trường.`);
      router.push(ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(school.id));
    } else {
      router.push(ROUTES.STAFF.ADMIN.SCHOOLS);
    }
  }

  function submitSchool() {
    setTouched(([, b]) => [true, b]);
    setFormError(null);
    if (hasErrors(errors1)) return focusFirstInvalid();
    createSchool.mutate(
      {
        name: form.name.trim(),
        schoolCode: form.schoolCode.trim() || undefined,
        address: form.address.trim() || undefined,
        contactEmail: form.contactEmail.trim().toLowerCase(),
        contactPhone: form.contactPhone.trim() ? compactPhone(form.contactPhone.trim()) : undefined,
        packageType: form.packageType,
        localHistoryPolicyAccepted: form.localHistoryPolicyAccepted,
      },
      {
        onSuccess: (created) => {
          setSchool(created);
          toast.success(`Đã tạo ${created.name} (mã ${created.schoolCode})`);
          // Pre-fill the admin email with the school's contact email; the System Admin can change it.
          setAdmin((a) => (a.email ? a : { ...a, email: created.contactEmail ?? "" }));
          window.scrollTo({ top: 0, behavior: "smooth" });
          focusById(`${ADMIN_PREFIX}-fullName`);
        },
        onError: (error) => {
          const mapped = schoolCreateError(error);
          if (mapped.field) {
            setServerErrors1((s) => ({ ...s, [mapped.field as SchoolFormField]: mapped.message }));
            focusById(ID(mapped.field));
          } else {
            setFormError(mapped.message);
          }
        },
      },
    );
  }

  function submitAdmin() {
    if (!school) return;
    setTouched(([a]) => [a, true]);
    setFormError(null);
    if (hasErrors(errors2)) return focusFirstInvalid();
    createAdmin.mutate(
      {
        schoolId: school.id,
        fullName: admin.fullName.trim(),
        email: admin.email.trim().toLowerCase(),
        phoneNumber: admin.phoneNumber.trim() ? compactPhone(admin.phoneNumber.trim()) : undefined,
      },
      {
        onSuccess: (created) => {
          toast.success(`Đã tạo tài khoản quản trị cho ${created.fullName}`);
          if (created.initialPassword) {
            setCredentials({ school, record: adminCredentialRecord(created) });
          } else {
            router.push(ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(school.id));
          }
        },
        onError: (error) => {
          const mapped = schoolAdminCreateError(error);
          if (mapped.field) {
            setServerErrors2((s) => ({ ...s, [mapped.field as AdminFormField]: mapped.message }));
            focusById(`${ADMIN_PREFIX}-${mapped.field}`);
          } else {
            setFormError(mapped.message);
          }
        },
      },
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (step === 0) submitSchool();
    else submitAdmin();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="archive-link" onClick={close} disabled={busy}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tất cả trường
          </button>
          <div className="w-full sm:w-[420px]">
            <StepIndicator step={step} />
          </div>
        </div>

        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-[2px] border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-danger)]" aria-hidden="true" />
            <span>{formError}</span>
          </p>
        )}

        <form id="create-school-form" onSubmit={submit} noValidate className="space-y-6" aria-busy={busy}>
          {step === 0 ? (
            <>
              <Panel>
                <SectionHeading title="Thông tin trường" description="Tên, mã và thông tin liên hệ của trường." />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Tên trường" required error={e1("name")} htmlFor={ID("name")} className="sm:col-span-2">
                    <StaffFormInput
                      id={ID("name")}
                      autoFocus
                      maxLength={255}
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Trường THPT Lê Hồng Phong"
                      aria-invalid={!!e1("name")}
                    />
                  </Field>
                  <Field label="Mã trường" error={e1("schoolCode")} htmlFor={ID("schoolCode")} hint="Để trống để hệ thống tự sinh (VD: LHP-HCM).">
                    <StaffFormInput
                      id={ID("schoolCode")}
                      value={form.schoolCode}
                      onChange={(e) => set("schoolCode", e.target.value.toUpperCase().replace(/\s+/g, ""))}
                      placeholder="Tự sinh"
                      maxLength={30}
                      className="font-mono"
                      aria-invalid={!!e1("schoolCode")}
                    />
                  </Field>
                </div>
                <Field label="Địa chỉ" htmlFor={ID("address")} hint="Ghi rõ tỉnh / thành: hệ thống dùng để sinh mã trường.">
                  <StaffFormInput
                    id={ID("address")}
                    maxLength={500}
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="280 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email liên hệ" required error={e1("contactEmail")} htmlFor={ID("contactEmail")}>
                    <StaffFormInput
                      id={ID("contactEmail")}
                      type="email"
                      autoComplete="off"
                      value={form.contactEmail}
                      onChange={(e) => set("contactEmail", e.target.value)}
                      placeholder="lienhe@truong.edu.vn"
                      aria-invalid={!!e1("contactEmail")}
                    />
                  </Field>
                  <Field label="Điện thoại liên hệ" error={e1("contactPhone")} htmlFor={ID("contactPhone")} hint="Không bắt buộc">
                    <StaffFormInput
                      id={ID("contactPhone")}
                      type="tel"
                      maxLength={20}
                      value={form.contactPhone}
                      onChange={(e) => set("contactPhone", e.target.value)}
                      placeholder="028 3839 8506"
                      aria-invalid={!!e1("contactPhone")}
                    />
                  </Field>
                </div>

              </Panel>

              <Panel>
                <SectionHeading title="Gói token" description="Quỹ token chung của trường; quản trị trường chia lại cho học sinh." />
                <fieldset className="space-y-2">
                  <legend className="sr-only">Gói token</legend>
                  <div role="radiogroup" aria-label="Gói token" className="grid gap-2 sm:grid-cols-3">
                    {PACKAGE_ORDER.map((p) => {
                      const checked = form.packageType === p;
                      return (
                        <label
                          key={p}
                          className={cn(
                            "flex cursor-pointer gap-3 rounded-[2px] border p-3 transition-colors focus-within:outline-2 focus-within:outline-[var(--accent-gold)]",
                            checked ? "border-[var(--text-primary)] bg-[var(--status-neutral-bg)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                          )}
                        >
                          <input
                            type="radio"
                            name="create-school-package"
                            value={p}
                            checked={checked}
                            onChange={() => set("packageType", p)}
                            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-gold)]"
                          />
                          <span className="min-w-0 space-y-0.5">
                            <span className="block text-sm font-bold text-content-heading">{PACKAGE_SHORT_LABELS[p]}</span>
                            <span className="block text-sm tabular-nums text-content-text">
                              {millionTokens(ENTERPRISE_PACKAGE_TOKENS[p])} token/tháng
                            </span>
                            <span className="block text-xs text-content-muted">{PACKAGE_HINTS[p]}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-content-muted">
                    Quỹ token chung của trường mỗi tháng ({formatNumber(ENTERPRISE_PACKAGE_TOKENS[form.packageType])} token); quản trị trường chia cho học sinh.
                  </p>
                </fieldset>

              </Panel>

              <Panel>
                <SectionHeading title="Cam kết" />
                <div className="space-y-1.5">
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-[2px] border p-3",
                      e1("localHistoryPolicyAccepted") ? "border-[var(--accent-danger)]" : "border-[var(--border-strong)]",
                    )}
                  >
                    <Checkbox
                      id={ID("localHistoryPolicyAccepted")}
                      checked={form.localHistoryPolicyAccepted}
                      onCheckedChange={(v) => set("localHistoryPolicyAccepted", v === true)}
                      aria-invalid={!!e1("localHistoryPolicyAccepted")}
                      aria-describedby="lcs-policy-text"
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <label htmlFor={ID("localHistoryPolicyAccepted")} className="cursor-pointer text-sm font-semibold text-content-heading">
                        Trường đồng ý cam kết nội dung lịch sử địa phương <span className="text-[var(--accent-danger)]">*</span>
                      </label>
                      <p id="lcs-policy-text" className="text-xs leading-relaxed text-content-muted">
                        Nội dung lịch sử địa phương do giáo viên của trường đưa lên phải chính xác, có nguồn và phù hợp chương trình; trường chịu trách
                        nhiệm kiểm duyệt trước khi chia sẻ cho học sinh. Bắt buộc để tạo trường.
                      </p>
                    </div>
                  </div>
                  {e1("localHistoryPolicyAccepted") && <p className="text-[11px] text-[var(--accent-danger)]">{e1("localHistoryPolicyAccepted")}</p>}
                </div>
              </Panel>
            </>
          ) : (
            <Panel>
              <SectionHeading
                title="Quản trị trường đầu tiên"
                description="Hệ thống tự sinh tên tài khoản và mật khẩu tạm; người này đăng nhập bằng email."
              />
                {school && (
                  <p className="flex items-start gap-2 rounded-[2px] border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-success)]" aria-hidden="true" />
                    <span>
                      Đã tạo <b className="text-content-heading">{school.name}</b> (mã <span className="font-mono">{school.schoolCode}</span>). Giờ cấp
                      tài khoản quản trị trường; bạn cũng có thể làm việc này sau ở trang của trường.
                    </span>
                  </p>
                )}
                <AdminAccountFields
                  idPrefix={ADMIN_PREFIX}
                  values={admin}
                  onChange={(v) => {
                    setAdmin(v);
                    setServerErrors2({});
                  }}
                  errors={{ fullName: e2("fullName"), email: e2("email"), phoneNumber: e2("phoneNumber") }}
                />
            </Panel>
          )}
        </form>

        {/* Sticky action bar: the buttons stay in view however long the form is. */}
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--text-primary)] bg-[var(--bg-surface)] px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" className="btn-line w-full sm:w-auto" onClick={close} disabled={busy}>
              {step === 0 ? "Hủy" : "Để sau"}
            </button>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              {step === 1 && <span className="text-xs text-content-muted">Trường đã được lưu; rời trang này không xóa trường.</span>}
              <button type="submit" form="create-school-form" className="btn-crimson w-full disabled:opacity-60 sm:w-auto" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang lưu...
                  </>
                ) : step === 0 ? (
                  <>
                    Tạo trường và tiếp tục <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                ) : (
                  "Tạo tài khoản quản trị"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {credentials && (
        <CredentialsDialog
          open
          onOpenChange={(o) => {
            if (o) return;
            const id = credentials.school.id;
            setCredentials(null);
            router.push(ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(id));
          }}
          title="Tài khoản quản trị trường"
          description={`${credentials.school.name} đã sẵn sàng. Gửi thông tin đăng nhập cho ${credentials.record.fullName} qua kênh an toàn; sau khi đóng, bạn sẽ chuyển tới trang của trường.`}
          records={[credentials.record]}
          schoolName={credentials.school.name}
          fileName={`quan-tri-${codeSlug(credentials.school.schoolCode)}-${todayStamp()}.csv`}
        />
      )}
    </>
  );
}

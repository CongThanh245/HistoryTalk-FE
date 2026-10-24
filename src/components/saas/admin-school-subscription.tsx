"use client";

import * as React from "react";
import { CalendarCheck2, Loader2, PlusCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { Field, Panel, SectionHeading, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { PACKAGE_ORDER, PACKAGE_SHORT_LABELS, millionTokens } from "@/features/saas/admin-schools";
import { useSchoolSubscriptionActions } from "@/features/saas/hooks-school-token";
import { ENTERPRISE_PACKAGE_TOKENS, type ApiSchool, type EnterprisePackage } from "@/services/school.service";
import { TOP_UP_MIN } from "@/services/school-token.service";

type Action = "renew" | "activate" | "topup" | null;

/**
 * System Admin (US-SP7-14): the school-year subscription (01/09 – 31/05). Renewal is only accepted in May and starts
 * on 01/09; activation (from 01/09) switches to the renewed package and carries over up to 20 % of the remaining pool;
 * a top-up adds tokens to the pool without changing the end date.
 */
export function SchoolSubscriptionPanel({ school }: { school: ApiSchool }) {
  const { renew, activate, topUp } = useSchoolSubscriptionActions(school.id);
  const [action, setAction] = React.useState<Action>(null);
  const [pkg, setPkg] = React.useState<EnterprisePackage>(school.packageType);
  const [amount, setAmount] = React.useState("1000000");
  const [note, setNote] = React.useState("");

  const now = new Date();
  const inMay = now.getMonth() === 4;
  const fromSeptember = now.getMonth() >= 8;
  const busy = renew.isPending || activate.isPending || topUp.isPending;
  const tokens = Number(amount.replace(/[.\s,]/g, ""));
  const amountError = !Number.isInteger(tokens) || tokens < TOP_UP_MIN ? `Tối thiểu ${formatNumber(TOP_UP_MIN)} token` : null;
  const carryOver = Math.floor(Math.max(0, school.unallocatedTokenQuota) * 0.2);

  const fail = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

  const confirm = () => {
    if (action === "renew") {
      renew.mutate(
        { packageType: pkg },
        { onSuccess: () => toast.success(`Đã gia hạn ${PACKAGE_SHORT_LABELS[pkg]} cho năm học tới`), onError: fail("Không gia hạn được gói.") },
      );
    } else if (action === "activate") {
      activate.mutate(undefined, {
        onSuccess: (s) => toast.success("Đã kích hoạt năm học mới", { description: `Quỹ mới: ${formatNumber(s.totalSchoolTokenQuota)} token` }),
        onError: fail("Không kích hoạt được năm học mới."),
      });
    } else if (action === "topup") {
      if (amountError) {
        toast.error(amountError);
        return;
      }
      topUp.mutate(
        { additionalTokens: tokens, note: note.trim() || undefined },
        { onSuccess: () => toast.success(`Đã nạp thêm ${formatNumber(tokens)} token vào quỹ trường`), onError: fail("Không nạp thêm được token.") },
      );
    }
    setAction(null);
  };

  return (
    <Panel>
      <SectionHeading
        title="Gói năm học"
        description="Gói chạy từ 01/09 đến 31/05. Quá 31/05 mà chưa gia hạn, toàn bộ tài khoản của trường bị khóa."
      />
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <dt className="text-[13px] font-semibold text-[var(--text-tertiary)]">Năm học hiện tại</dt>
          <dd className="font-semibold text-content-heading">
            {school.subscriptionStartDate && school.subscriptionEndDate
              ? `${formatDate(school.subscriptionStartDate)} – ${formatDate(school.subscriptionEndDate)}`
              : "—"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[13px] font-semibold text-[var(--text-tertiary)]">Năm học tới</dt>
          <dd className="font-semibold text-content-heading">
            {school.renewedForNextYear
              ? `Đã gia hạn${school.nextPackageType ? ` · ${PACKAGE_SHORT_LABELS[school.nextPackageType]}` : ""}`
              : "Chưa gia hạn"}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[13px] font-semibold text-[var(--text-tertiary)]">Hạn mức mặc định</dt>
          <dd className="font-semibold text-content-heading">
            {school.defaultDailyStudentQuota ? `${formatNumber(school.defaultDailyStudentQuota)} token / học sinh / ngày` : "—"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" className="btn-crimson disabled:opacity-60" disabled={busy} onClick={() => setAction("renew")}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Gia hạn năm học tới
        </button>
        <button
          type="button"
          className="btn-ink disabled:opacity-60"
          disabled={busy || !school.renewedForNextYear}
          title={school.renewedForNextYear ? undefined : "Trường chưa gia hạn cho năm học tới"}
          onClick={() => setAction("activate")}
        >
          <CalendarCheck2 className="h-4 w-4" aria-hidden="true" /> Kích hoạt năm học mới
        </button>
        <button type="button" className="btn-line disabled:opacity-60" disabled={busy} onClick={() => setAction("topup")}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PlusCircle className="h-4 w-4" aria-hidden="true" />} Nạp thêm token
        </button>
      </div>
      <p className="text-xs text-content-muted">
        Gia hạn chỉ thực hiện được trong tháng 5{inMay ? " (đang trong tháng 5)" : ""}. Kích hoạt năm học mới từ ngày 01/09
        {fromSeptember ? "" : " (chưa tới)"}.
      </p>

      <ConfirmDialog
        open={action === "renew"}
        onOpenChange={(o) => !o && setAction(null)}
        variant="primary"
        title={`Gia hạn ${school.name} cho năm học tới?`}
        description={`Gói mới bắt đầu từ 01/09. ${inMay ? "" : "Máy chủ chỉ nhận gia hạn trong tháng 5."}`}
        confirmLabel="Gia hạn"
        onConfirm={confirm}
      >
        <Field label="Gói năm học tới">
          <StaffFormSelect
            value={pkg}
            onValueChange={setPkg}
            options={PACKAGE_ORDER.map((p) => ({ value: p, label: `${PACKAGE_SHORT_LABELS[p]} · ${millionTokens(ENTERPRISE_PACKAGE_TOKENS[p])} token` }))}
            className="w-full"
          />
        </Field>
      </ConfirmDialog>

      <ConfirmDialog
        open={action === "activate"}
        onOpenChange={(o) => !o && setAction(null)}
        variant="warning"
        title="Kích hoạt năm học mới?"
        description={`Trường chuyển sang ${school.nextPackageType ? PACKAGE_SHORT_LABELS[school.nextPackageType] : "gói đã gia hạn"}, năm học 01/09 – 31/05 mới. Quỹ mới = token của gói + 20% quỹ còn dư (khoảng ${formatNumber(carryOver)} token); phần dư còn lại bị thu hồi.`}
        confirmLabel="Kích hoạt"
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={action === "topup"}
        onOpenChange={(o) => !o && setAction(null)}
        variant="primary"
        title={`Nạp thêm token cho ${school.name}?`}
        description="Token được cộng thẳng vào quỹ chung của trường; ngày hết hạn 31/05 không đổi."
        confirmLabel="Nạp thêm"
        onConfirm={confirm}
      >
        <div className="space-y-3">
          <Field label="Số token" required error={amountError} htmlFor="topup-amount">
            <StaffFormInput id="topup-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Ghi chú" htmlFor="topup-note">
            <StaffFormTextarea id="topup-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[70px] resize-y" />
          </Field>
        </div>
      </ConfirmDialog>
    </Panel>
  );
}

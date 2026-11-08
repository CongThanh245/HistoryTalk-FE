"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { b2bQuoteService, type B2bQuote, type B2bQuoteInput } from "@/services/b2b-quote.service";
import { cn } from "@/lib/utils/cn";

const JOB_TITLES = ["Hiệu trưởng", "Phó Hiệu trưởng", "Tổ trưởng Sử", "Giáo viên Lịch sử", "Cán bộ CNTT"];

type FormValues = {
  lastName: string;
  firstName: string;
  contactEmail: string;
  contactPhone: string;
  jobTitle: string;
  schoolName: string;
  schoolCode: string;
  schoolAddress: string;
  message: string;
};

const EMPTY: FormValues = {
  lastName: "",
  firstName: "",
  contactEmail: "",
  contactPhone: "",
  jobTitle: "",
  schoolName: "",
  schoolCode: "",
  schoolAddress: "",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: FormValues) {
  const e: Partial<Record<keyof FormValues, string>> = {};
  if (!v.lastName.trim()) e.lastName = "Nhập họ và tên đệm.";
  if (!v.firstName.trim()) e.firstName = "Nhập tên.";
  if (!EMAIL_PATTERN.test(v.contactEmail.trim())) e.contactEmail = "Nhập email hợp lệ. Email này sẽ dùng để cấp tài khoản quản trị trường.";
  if (!/^[0-9+\s().-]{8,30}$/.test(v.contactPhone.trim())) e.contactPhone = "Nhập số điện thoại hợp lệ.";
  if (!v.jobTitle.trim()) e.jobTitle = "Nhập chức vụ.";
  if (!v.schoolName.trim()) e.schoolName = "Nhập tên trường.";
  return e;
}

const inputClass =
  "h-11 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:outline-none";

function Field({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
        {label}
        {required && <span className="text-[var(--accent-gold)]" aria-hidden="true"> *</span>}
      </label>
      {React.cloneElement(children, { id, "aria-invalid": !!error, "aria-describedby": error ? errorId : undefined })}
      {error && (
        <span id={errorId} className="text-xs text-[var(--accent-danger)]">
          {error}
        </span>
      )}
    </div>
  );
}

/** "Request a quote": sends the school's contact details with the plan chosen in the calculator. */
export function B2bQuoteForm({
  quote,
  summary,
  onSubmitted,
}: {
  quote: B2bQuoteInput;
  summary: string;
  /** Called when the confirmation with the quote code is closed (e.g. to close the dialog holding the form). */
  onSubmitted?: () => void;
}) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitted, setSubmitted] = useState<B2bQuote | null>(null);
  const closeConfirmation = () => {
    setSubmitted(null);
    onSubmitted?.();
  };
  const set = (key: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = useMutation({
    mutationFn: () =>
      b2bQuoteService.request({
        ...quote,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        contactEmail: values.contactEmail.trim(),
        contactPhone: values.contactPhone.trim(),
        jobTitle: values.jobTitle.trim(),
        schoolName: values.schoolName.trim(),
        schoolCode: values.schoolCode.trim() || undefined,
        schoolAddress: values.schoolAddress.trim() || undefined,
        message: values.message.trim() || undefined,
      }),
    onSuccess: (result) => {
      setSubmitted(result);
      setValues(EMPTY);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Chưa gửi được yêu cầu báo giá. Vui lòng thử lại.")),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length === 0) submit.mutate();
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <p className="sm:col-span-2 border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          Gói đang chọn: <strong className="text-[var(--text-primary)]">{summary}</strong>
        </p>
        <Field id="b2b-last-name" label="Họ và tên đệm" required error={errors.lastName}>
          <input className={inputClass} value={values.lastName} onChange={set("lastName")} maxLength={100} autoComplete="family-name" />
        </Field>
        <Field id="b2b-first-name" label="Tên" required error={errors.firstName}>
          <input className={inputClass} value={values.firstName} onChange={set("firstName")} maxLength={100} autoComplete="given-name" />
        </Field>
        <Field id="b2b-email" label="Email công việc" required error={errors.contactEmail}>
          <input
            className={inputClass}
            type="email"
            value={values.contactEmail}
            onChange={set("contactEmail")}
            autoComplete="email"
            placeholder="hieutruong@truong.edu.vn"
          />
        </Field>
        <Field id="b2b-phone" label="Số điện thoại" required error={errors.contactPhone}>
          <input className={inputClass} type="tel" value={values.contactPhone} onChange={set("contactPhone")} maxLength={30} autoComplete="tel" />
        </Field>
        <Field id="b2b-job-title" label="Chức vụ" required error={errors.jobTitle}>
          <input className={inputClass} value={values.jobTitle} onChange={set("jobTitle")} list="b2b-job-titles" maxLength={100} />
        </Field>
        <datalist id="b2b-job-titles">
          {JOB_TITLES.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>
        <Field id="b2b-school-name" label="Tên trường" required error={errors.schoolName}>
          <input className={inputClass} value={values.schoolName} onChange={set("schoolName")} maxLength={255} placeholder="Trường THPT ..." />
        </Field>
        <Field id="b2b-school-code" label="Mã trường (không bắt buộc)">
          <input className={inputClass} value={values.schoolCode} onChange={set("schoolCode")} maxLength={50} placeholder="Để trống để hệ thống tự tạo" />
        </Field>
        <Field id="b2b-school-address" label="Địa chỉ trường (không bắt buộc)">
          <input className={inputClass} value={values.schoolAddress} onChange={set("schoolAddress")} maxLength={500} />
        </Field>
        <Field id="b2b-message" label="Ghi chú thêm (không bắt buộc)" className="sm:col-span-2">
          <textarea
            className={cn(inputClass, "h-24 resize-y py-2")}
            value={values.message}
            onChange={set("message")}
            maxLength={2000}
            placeholder="VD: cần xuất hoá đơn VAT, thời gian triển khai mong muốn..."
          />
        </Field>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={submit.isPending}
            className="btn-crimson inline-flex min-h-11 w-full items-center justify-center gap-2 px-6 text-[13px] font-bold uppercase tracking-[0.08em] sm:w-auto"
          >
            {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Gửi yêu cầu báo giá
          </button>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Chúng tôi sẽ liên hệ để tư vấn. Khi báo giá được duyệt, tài khoản quản trị trường được cấp qua email bạn nhập ở trên.
          </p>
        </div>
      </form>

      <Dialog open={!!submitted} onOpenChange={(open) => !open && closeConfirmation()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-(--status-success)" aria-hidden="true" />
              Đã gửi yêu cầu báo giá
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-content-text">
              Mã báo giá của {submitted?.schoolName}:
            </DialogDescription>
          </DialogHeader>
          <p className="border border-[var(--text-primary)] py-3 text-center font-display text-2xl font-extrabold tracking-[0.06em]">
            {submitted?.quoteCode}
          </p>
          <p className="text-sm text-content-text">
            Hãy lưu mã này để tra cứu khi trao đổi với HistoryTalk. Chúng tôi sẽ liên hệ qua {submitted?.contactEmail} hoặc{" "}
            {submitted?.contactPhone}.
          </p>
          <DialogFooter>
            <button type="button" onClick={closeConfirmation} className="btn-crimson min-h-0 px-4 py-2 text-sm">
              Đã hiểu
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Date inputs that always show Vietnamese order (dd/mm/yyyy), regardless of the browser locale.
 * Native <input type="date"> follows the browser language (mm/dd/yyyy on English browsers), so we
 * render a masked text field instead and keep a hidden native input only to open the OS picker.
 * Values in/out stay ISO ("yyyy-MM-dd" / "yyyy-MM-ddTHH:mm"), so callers and the BE are unchanged.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** "yyyy-MM-dd" (or longer ISO) → "dd/mm/yyyy"; "" when not a date. */
export function isoToVnDate(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/** "dd/mm/yyyy" → "yyyy-MM-dd"; "" when incomplete or not a real calendar day. */
export function vnDateToIso(text: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return "";
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1000 || mo < 1 || mo > 12 || d < 1) return "";
  const last = new Date(y, mo, 0).getDate();
  if (d > last) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Keep digits only and insert slashes: "13022005" → "13/02/2005". */
function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Keep digits only and insert a colon: "0930" → "09:30". */
function maskTime(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function validTime(text: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(text);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

function openNativePicker(input: HTMLInputElement | null) {
  if (!input) return;
  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
  } catch {
    // showPicker throws when not triggered by a user gesture or unsupported; fall through.
  }
  input.focus();
  input.click();
}

type FieldComponent = "input" | React.ComponentType<React.ComponentPropsWithRef<"input">>;

type InputLikeProps =Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max">;

export interface DateInputProps extends InputLikeProps {
  /** ISO "yyyy-MM-dd" or "". */
  value: string;
  /** Called with ISO "yyyy-MM-dd" when a full valid date is entered/picked, "" when cleared. */
  onValueChange: (iso: string) => void;
  /** ISO bounds, used by the picker. */
  min?: string;
  max?: string;
  /** Element used for the visible field (e.g. `Input`, `StaffFormInput`). Defaults to a plain <input>. */
  component?: FieldComponent;
  wrapperClassName?: string;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { value, onValueChange, min, max, component: Field = "input", className, wrapperClassName, disabled, placeholder, onBlur, ...rest },
  ref,
) {
  const [text, setText] = React.useState(() => isoToVnDate(value));
  const nativeRef = React.useRef<HTMLInputElement>(null);

  // Sync from outside (form reset, picker, async load) unless the typed text already means the same day.
  React.useEffect(() => {
    setText((current) => (vnDateToIso(current) === (value ?? "").slice(0, 10) && value ? current : isoToVnDate(value)));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = maskDate(e.target.value);
    setText(next);
    if (!next) {
      onValueChange("");
      return;
    }
    const iso = vnDateToIso(next);
    if (iso) onValueChange(iso);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Drop half-typed text so the field never shows something different from the real value.
    if (text && !vnDateToIso(text)) setText(isoToVnDate(value));
    onBlur?.(e);
  };

  return (
    <div className={cn("relative", wrapperClassName)}>
      <Field
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        placeholder={placeholder || "dd/mm/yyyy"}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn("pr-9 tabular-nums", className)}
        {...rest}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Chọn ngày"
        disabled={disabled}
        onClick={() => openNativePicker(nativeRef.current)}
        className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-50"
      >
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        ref={nativeRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={(value ?? "").slice(0, 10)}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onValueChange(e.target.value)}
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
      />
    </div>
  );
});

export interface DateTimeInputProps extends Omit<DateInputProps, "min" | "max" | "placeholder"> {
  /** "yyyy-MM-ddTHH:mm" or "" (same shape as <input type="datetime-local">). */
  value: string;
  /** Called with "yyyy-MM-ddTHH:mm" once both parts are valid, "" when the date is cleared. */
  onValueChange: (value: string) => void;
}

/** Date (dd/mm/yyyy) + 24h time (HH:mm), emitting the datetime-local string format. */
export function DateTimeInput({ value, onValueChange, component, className, wrapperClassName, disabled, id, ...rest }: DateTimeInputProps) {
  const datePart = (value ?? "").slice(0, 10);
  const timePart = (value ?? "").slice(11, 16);
  const [date, setDate] = React.useState(datePart);
  const [time, setTime] = React.useState(timePart);

  React.useEffect(() => {
    setDate(datePart);
    setTime(timePart);
  }, [datePart, timePart]);

  const emit = (d: string, t: string) => {
    if (!d) onValueChange("");
    else if (validTime(t)) onValueChange(`${d}T${t}`);
  };

  const Field = component ?? "input";
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_6.5rem] gap-2", wrapperClassName)}>
      <DateInput
        id={id}
        value={date}
        component={component}
        className={className}
        disabled={disabled}
        onValueChange={(d) => {
          setDate(d);
          emit(d, time || "23:59");
          if (d && !time) setTime("23:59");
        }}
        {...rest}
      />
      <Field
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder="hh:mm"
        aria-label="Giờ (24h)"
        value={time}
        disabled={disabled}
        className={cn("tabular-nums", className)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const t = maskTime(e.target.value);
          setTime(t);
          if (validTime(t)) emit(date, t);
        }}
        onBlur={() => {
          if (time && !validTime(time)) setTime(timePart);
        }}
      />
    </div>
  );
}

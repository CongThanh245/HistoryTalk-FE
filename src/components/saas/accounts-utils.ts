"use client";

import { toast } from "sonner";
import { downloadTextFile } from "@/features/saas/student-import";

/**
 * Account helpers shared by the System Admin (School Admin accounts) and School Admin (teachers, students)
 * screens: mock temp passwords, VN phone validation, credential CSV export and the printable account sheet.
 * Once the API exists, temp passwords come from the backend; only the generator below goes away.
 */

/** Vietnamese classes are capped at 45 students (Thông tư 32/2020); used for seat checks when moving students. */
export const MAX_CLASS_SIZE = 45;

/* ───────────────────────── Temp passwords ───────────────────────── */
// Readable: no diacritics, no look-alike characters (0/O, 1/l/I).
const WORDS = ["Sen", "Mai", "Tre", "Song", "Nui", "Trang", "Sao", "Gio", "Bien", "Rong", "Hac", "Lua", "Dao", "Cau", "Thuyen", "Den"];
const SYMBOLS = ["@", "#", "!", "*"];

function randomInt(max: number) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/** e.g. "SenTre-4827#": two words, four digits (2–9 only) and a symbol. */
export function generateTempPassword() {
  const digits = Array.from({ length: 4 }, () => String(2 + randomInt(8))).join("");
  return `${WORDS[randomInt(WORDS.length)]}${WORDS[randomInt(WORDS.length)]}-${digits}${SYMBOLS[randomInt(SYMBOLS.length)]}`;
}

/* ───────────────────────── Validation ───────────────────────── */
const compactPhone = (v: string) => v.replace(/[\s.()-]/g, "");

/** Vietnamese mobile number: 10 digits starting 03/05/07/08/09, or +84 followed by 9 digits. */
export function isValidVnPhone(v: string) {
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(compactPhone(v));
}

/** "0903112233" / "+84903112233" → "0903 112 233". */
export function formatVnPhone(v: string) {
  const c = compactPhone(v).replace(/^\+84/, "0");
  return /^\d{10}$/.test(c) ? `${c.slice(0, 4)} ${c.slice(4, 7)} ${c.slice(7)}` : v.trim();
}

export const STUDENT_CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/;
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

/* ───────────────────────── Credentials ───────────────────────── */
export interface CredentialRecord {
  id: string;
  fullName: string;
  /** What the user types on the login form: username (mock students) or email (staff; the live backend logs in by email). */
  login: string;
  /**
   * Backend-generated account name (live API). When set, `login` is the email and this is shown as secondary
   * info: the dialog, CSV and printed sheet label `login` "Email đăng nhập" and add a "Tên tài khoản" line.
   */
  userName?: string;
  password: string;
  /** Role label printed on the account sheet, e.g. "Học sinh", "Giáo viên". */
  roleLabel: string;
  studentCode?: string;
  className?: string;
}

const csvCell = (v: string | number | undefined | null) => {
  const s = v == null ? "" : String(v);
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Builds a UTF-8 CSV with BOM (opens with diacritics intact in Excel). */
export function toCsv(rows: (string | number | undefined | null)[][]) {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, rows: (string | number | undefined | null)[][]) {
  downloadTextFile(filename, toCsv(rows));
}

/** Label of `login`: "Email đăng nhập" when the record also carries a backend `userName`. */
export const loginLabel = (r: Pick<CredentialRecord, "userName">) => (r.userName ? "Email đăng nhập" : "Tên đăng nhập");
export const USER_NAME_LABEL = "Tên tài khoản";

/** "Danh sách tài khoản" CSV: họ tên, mã HS, lớp, tên đăng nhập (or email + tên tài khoản), mật khẩu tạm. */
export function downloadCredentialsCsv(filename: string, records: CredentialRecord[]) {
  const withCode = records.some((r) => r.studentCode);
  const withUserName = records.some((r) => r.userName);
  const header = [
    "Họ và tên",
    ...(withCode ? ["Mã học sinh", "Lớp"] : ["Vai trò"]),
    withUserName ? "Email đăng nhập" : "Tên đăng nhập",
    ...(withUserName ? [USER_NAME_LABEL] : []),
    "Mật khẩu tạm",
  ];
  downloadCsv(filename, [
    header,
    ...records.map((r) => [
      r.fullName,
      ...(withCode ? [r.studentCode ?? "", r.className ?? ""] : [r.roleLabel]),
      r.login,
      ...(withUserName ? [r.userName ?? ""] : []),
      r.password,
    ]),
  ]);
}

export async function copyText(text: string, success = "Đã sao chép") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error("Trình duyệt chặn sao chép. Hãy chọn và sao chép thủ công.");
  }
}

export const todayStamp = () => new Date().toISOString().slice(0, 10);

/* ───────────────────────── Printable account sheet ───────────────────────── */
const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** HTML of the "Phiếu tài khoản" sheet: one cut-out card per account, two per row on A4. */
export function buildCredentialSheetHtml({
  title,
  schoolName,
  records,
  loginUrl,
}: {
  title: string;
  schoolName?: string;
  records: CredentialRecord[];
  loginUrl: string;
}) {
  const cards = records
    .map(
      (r) => `
      <article class="card">
        <header><span>${esc(schoolName ?? "HistoryTalk")}</span><span>${esc(r.roleLabel)}</span></header>
        <h2>${esc(r.fullName)}</h2>
        ${r.studentCode || r.className ? `<p class="meta">${r.studentCode ? `Mã HS: <b>${esc(r.studentCode)}</b>` : ""}${r.studentCode && r.className ? " · " : ""}${r.className ? `Lớp: <b>${esc(r.className)}</b>` : ""}</p>` : ""}
        <dl>
          <dt>${esc(loginLabel(r))}</dt><dd>${esc(r.login)}</dd>
          ${r.userName ? `<dt>${USER_NAME_LABEL}</dt><dd class="sub">${esc(r.userName)}</dd>` : ""}
          <dt>Mật khẩu tạm</dt><dd>${esc(r.password)}</dd>
        </dl>
        <footer>Đăng nhập tại ${esc(loginUrl)} và đổi mật khẩu ở lần đăng nhập đầu tiên.</footer>
      </article>`,
    )
    .join("");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Be Vietnam Pro", "Segoe UI", Arial, sans-serif; color: #1c1a17; background: #fff; }
  .top { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #1c1a17; padding-bottom: 6px; margin-bottom: 10px; }
  .top h1 { margin: 0; font-size: 18px; line-height: 1.3; }
  .top p { margin: 0; font-size: 11px; color: #5b554c; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .card { border: 1px dashed #8a8276; padding: 10px 12px; break-inside: avoid; page-break-inside: avoid; min-height: 46mm; }
  .card header { display: flex; justify-content: space-between; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; color: #8b1e1e; font-weight: 700; }
  .card h2 { margin: 6px 0 2px; font-size: 15px; line-height: 1.3; }
  .meta { margin: 0 0 6px; font-size: 11px; color: #3d3831; }
  dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; margin: 6px 0; font-size: 12px; }
  dt { color: #5b554c; }
  dd { margin: 0; font-family: "Consolas", "Courier New", monospace; font-weight: 700; font-size: 13px; }
  dd.sub { font-weight: 400; font-size: 12px; }
  footer { font-size: 9.5px; color: #5b554c; line-height: 1.35; }
</style></head><body>
  <div class="top"><h1>${esc(title)}</h1><p>${esc(schoolName ?? "")} · ${records.length} tài khoản · in ngày ${new Date().toLocaleDateString("vi-VN")}</p></div>
  <main class="grid">${cards}</main>
</body></html>`;
}

/** Prints the sheet through a hidden iframe (no popup, keeps the current page intact). */
export function printCredentialSheet(opts: { title: string; schoolName?: string; records: CredentialRecord[] }) {
  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    toast.error("Không mở được bản in.");
    return;
  }
  doc.open();
  doc.write(buildCredentialSheetHtml({ ...opts, loginUrl }));
  doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(() => {
    win.focus();
    win.print();
    // Some browsers never fire afterprint for iframes.
    setTimeout(cleanup, 60_000);
  }, 150);
}

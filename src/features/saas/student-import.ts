/**
 * Student import file helpers (School Admin → POST /school-admin/students/import-excel).
 * No dependencies: a small RFC 4180-style CSV reader that also accepts ";" (Excel with a Vietnamese locale).
 */

export function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim()));
}

const strip = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** dd/mm/yyyy, d-m-yyyy or yyyy-mm-dd → yyyy-mm-dd; null when invalid. */
export function parseDob(v: string): string | null {
  let y: number, m: number, d: number;
  const vn = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (vn) [d, m, y] = [Number(vn[1]), Number(vn[2]), Number(vn[3])];
  else if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export interface ImportTable {
  headers: string[];
  /** Data rows (header excluded), padded to the header width. */
  rows: string[][];
}

/** Decodes the uploaded bytes as UTF-8; falls back to Windows-1258 (old Vietnamese Excel "CSV" files). */
export function decodeImportFile(buffer: ArrayBuffer): { text: string; encoding: "utf-8" | "windows-1258" } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "utf-8" };
  } catch {
    try {
      return { text: new TextDecoder("windows-1258").decode(buffer), encoding: "windows-1258" };
    } catch {
      return { text: new TextDecoder("utf-8").decode(buffer), encoding: "utf-8" };
    }
  }
}

export function readTable(text: string): { table?: ImportTable; fileError?: string } {
  const all = parseCsv(text).filter((r) => r.some((c) => c !== ""));
  if (all.length === 0) return { fileError: "File trống." };
  if (all.length === 1) return { fileError: "File chỉ có dòng tiêu đề, chưa có học sinh." };
  const width = Math.max(...all.map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => all[0][i]?.trim() || `Cột ${i + 1}`);
  const rows = all.slice(1).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));
  return { table: { headers, rows } };
}

/** parseDob plus Excel date serials (e.g. 40252 → 2010-03-15). */
export function parseDobLoose(v: string): string | null {
  if (/^\d{5}$/.test(v)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(v) * 86_400_000);
    return d.toISOString().slice(0, 10);
  }
  return parseDob(v);
}

// `POST /school-admin/students/import-excel` reads the CSV itself (Apache Commons CSV, UTF-8, header row,
// header names case-insensitive, "," only). The wizard maps whatever the School Admin uploaded onto the
// backend columns, checks the rows client-side and then sends a regenerated, normalized CSV:
//   student_code,full_name,email,dob,gender,phone_number,password,additional_token
// Backend rules (AbstractStudentImportProcessor): full_name and dob (yyyy-MM-dd) are required; student_code is
// optional (auto "<SCHOOL>_HSyyNNNNN") and must match ^[A-Za-z0-9_-]{2,30}$; gender MALE/FEMALE (anything else is
// stored empty); password < 6 chars falls back to "<student_code>@2026". The backend does NOT strip a UTF-8 BOM,
// so the file we send never has one.
// Sprint 7 (shared pool + daily limit): additional_token is always sent empty and defaultInitialToken=0 — the
// backend still moves those tokens out of the school pool, but the daily-limit model overwrites the wallet.

export const BACKEND_IMPORT_COLUMNS = [
  "student_code",
  "full_name",
  "email",
  "dob",
  "gender",
  "phone_number",
  "password",
  "additional_token",
] as const;

export type StudentImportField = "studentCode" | "fullName" | "email" | "dob" | "gender" | "phoneNumber" | "password" | "additionalToken";

export const STUDENT_IMPORT_FIELDS: { key: StudentImportField; column: (typeof BACKEND_IMPORT_COLUMNS)[number]; label: string; required: boolean; hint: string }[] = [
  { key: "studentCode", column: "student_code", label: "Mã học sinh", required: false, hint: "2–30 ký tự không dấu, số, - và _ · bỏ trống để hệ thống tự sinh" },
  { key: "fullName", column: "full_name", label: "Họ và tên", required: true, hint: "Ví dụ: Nguyễn Văn An" },
  { key: "email", column: "email", label: "Email", required: false, hint: "Bỏ trống: hệ thống cấp email đăng nhập dạng …@saas.historytalk.vn" },
  { key: "dob", column: "dob", label: "Ngày sinh", required: true, hint: "dd/mm/yyyy hoặc yyyy-mm-dd" },
  { key: "gender", column: "gender", label: "Giới tính", required: false, hint: "Nam / Nữ (MALE / FEMALE)" },
  { key: "phoneNumber", column: "phone_number", label: "Số điện thoại", required: false, hint: "Không bắt buộc" },
  { key: "password", column: "password", label: "Mật khẩu", required: false, hint: "≥ 6 ký tự · bỏ trống: <mã HS>@2026" },
  { key: "additionalToken", column: "additional_token", label: "Token cộng thêm (bỏ qua)", required: false, hint: "Không dùng nữa: học sinh dùng quỹ chung của trường theo hạn mức ngày" },
];

const FIELD_ALIASES: Record<StudentImportField, string[]> = {
  studentCode: ["student_code", "student code", "studentcode", "ma hoc sinh", "ma hs", "mshs", "ma so", "ma so hoc sinh", "student id", "code"],
  fullName: ["full_name", "full name", "fullname", "ho va ten", "ho ten", "ho & ten", "ten hoc sinh", "hoc sinh", "name", "student name"],
  email: ["email", "e-mail", "mail", "thu dien tu", "gmail"],
  dob: ["dob", "date of birth", "birthday", "birth date", "ngay sinh", "ngay thang nam sinh", "sinh ngay"],
  gender: ["gender", "sex", "gioi tinh", "phai"],
  phoneNumber: ["phone_number", "phone number", "phone", "so dien thoai", "sdt", "dien thoai"],
  password: ["password", "mat khau", "mat khau tam"],
  additionalToken: ["additional_token", "additional token", "token cong them", "token them", "token"],
};

export type StudentColumnMapping = Record<StudentImportField, number>;

export function autoMapStudentColumns(headers: string[]): StudentColumnMapping {
  const norm = headers.map((h) => strip(h).replace(/^﻿/, ""));
  const used = new Set<number>();
  const mapping = {} as StudentColumnMapping;
  for (const f of STUDENT_IMPORT_FIELDS) {
    const idx = norm.findIndex((h, i) => !used.has(i) && FIELD_ALIASES[f.key].includes(h));
    mapping[f.key] = idx;
    if (idx >= 0) used.add(idx);
  }
  return mapping;
}

/** "Nam"/"M"/"male" → MALE, "Nữ"/"F"/"female" → FEMALE, "" → "", anything else → null (invalid). */
export function parseGender(v: string): "MALE" | "FEMALE" | "" | null {
  const g = strip(v);
  if (!g) return "";
  if (["nam", "m", "male", "trai"].includes(g)) return "MALE";
  if (["nu", "f", "female", "gai"].includes(g)) return "FEMALE";
  return null;
}

export type StudentRowValues = Record<StudentImportField, string>;

export interface CheckedStudentRow {
  /** Line in the uploaded file (header = 1). */
  line: number;
  /** Normalized values, ready for the backend CSV. */
  values: StudentRowValues;
  errors: Partial<Record<StudentImportField, string>>;
  warnings: string[];
}

const STUDENT_CODE_PATTERN = /^[A-Za-z0-9_-]{2,30}$/;

export function checkStudentRows(table: ImportTable, mapping: StudentColumnMapping): CheckedStudentRow[] {
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const codeLine = new Map<string, number>();
  const emailLine = new Map<string, number>();

  return table.rows.map((r, k) => {
    const line = k + 2;
    const errors: CheckedStudentRow["errors"] = {};
    const warnings: string[] = [];
    const raw = Object.fromEntries(STUDENT_IMPORT_FIELDS.map((f) => [f.key, get(r, mapping[f.key])])) as StudentRowValues;
    const values: StudentRowValues = { ...raw, fullName: raw.fullName.replace(/\s+/g, " ") };

    if (!values.fullName) errors.fullName = "Thiếu họ và tên";
    else if (values.fullName.length > 150) errors.fullName = "Họ tên tối đa 150 ký tự";

    if (values.studentCode) {
      const key = values.studentCode.toLowerCase();
      if (!STUDENT_CODE_PATTERN.test(values.studentCode)) errors.studentCode = "2–30 ký tự: chữ không dấu, số, - và _";
      else if (codeLine.has(key)) errors.studentCode = `Trùng mã với dòng ${codeLine.get(key)}`;
      else codeLine.set(key, line);
    }

    if (!raw.dob) errors.dob = "Thiếu ngày sinh (máy chủ bắt buộc)";
    else {
      const parsed = parseDobLoose(raw.dob);
      if (!parsed) errors.dob = "Ngày sinh không hợp lệ (dd/mm/yyyy)";
      else values.dob = parsed;
    }

    if (values.email) {
      const key = values.email.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = "Email không hợp lệ";
      else if (emailLine.has(key)) errors.email = `Trùng email với dòng ${emailLine.get(key)}`;
      else {
        emailLine.set(key, line);
        values.email = key;
      }
    }

    if (raw.gender) {
      const g = parseGender(raw.gender);
      if (g === null) errors.gender = "Giới tính: Nam hoặc Nữ";
      else values.gender = g;
    }

    if (values.phoneNumber.length > 20) errors.phoneNumber = "Tối đa 20 ký tự";

    if (values.password && values.password.length < 6) {
      warnings.push("Mật khẩu dưới 6 ký tự — máy chủ sẽ dùng <mã HS>@2026");
    }

    // Never sent: tokens are no longer handed out per student (see the header comment).
    if (raw.additionalToken && raw.additionalToken.replace(/[.\s0]/g, "")) {
      warnings.push("Cột token cộng thêm được bỏ qua — học sinh dùng quỹ chung theo hạn mức ngày");
    }
    values.additionalToken = "";

    return { line, values, errors, warnings };
  });
}

const backendCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Normalized UTF-8 CSV (no BOM) with the exact backend header. */
export function buildBackendCsv(rows: StudentRowValues[]): string {
  const lines = [
    BACKEND_IMPORT_COLUMNS.join(","),
    ...rows.map((v) => STUDENT_IMPORT_FIELDS.map((f) => backendCell(v[f.key] ?? "")).join(",")),
  ];
  return lines.join("\r\n") + "\r\n";
}

/**
 * Copy of an uploaded CSV with the `additional_token` column emptied, for imports that send the user's file as is
 * (class roster). The backend would otherwise take those tokens out of the school pool (see the header comment).
 */
export function withoutAdditionalTokens(text: string): string {
  const rows = parseCsv(text);
  const col = (rows[0] ?? []).findIndex((h) => h.trim().replace(/^﻿/, "").toLowerCase() === "additional_token");
  if (col < 0) return text;
  return rows.map((r, i) => r.map((v, j) => (i > 0 && j === col ? "" : backendCell(v))).join(",")).join("\r\n") + "\r\n";
}

/** Backend template for download (with BOM so Excel keeps the diacritics; the wizard strips it before sending). */
export function buildBackendTemplateCsv(): string {
  const rows = [
    BACKEND_IMPORT_COLUMNS.join(","),
    "HS2600001,Nguyễn Văn An,,2010-03-15,MALE,0901234567,,",
    "HS2600002,Trần Thị Bình,binh.tran@gmail.com,2010-11-02,FEMALE,,MatKhau@2026,",
  ];
  return "﻿" + rows.join("\r\n") + "\r\n";
}

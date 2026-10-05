import type { Classroom, StudentImportRow } from "./types";

/**
 * Client-side parsing + validation of the student import file (Role Matrix row 4: bulk import).
 * No dependencies: a small RFC 4180-style CSV reader that also accepts ";" (Excel with a Vietnamese locale).
 */

export const IMPORT_COLUMNS = ["Họ và tên", "Mã học sinh", "Khối", "Ngày sinh", "Lớp"] as const;

export function buildTemplateCsv() {
  const rows = [
    IMPORT_COLUMNS.join(","),
    "Nguyễn Văn An,HS10101,10,15/03/2010,10A1",
    "Trần Thị Bình,HS10102,10,02/11/2010,10A2",
  ];
  // BOM so Excel opens the file as UTF-8 (keeps the Vietnamese diacritics).
  return "﻿" + rows.join("\r\n") + "\r\n";
}

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

const HEADER_ALIASES: Record<keyof RawRow, string[]> = {
  fullName: ["ho va ten", "ho ten", "ten", "full name", "fullname"],
  studentCode: ["ma hoc sinh", "ma hs", "ma so", "student code", "studentcode"],
  grade: ["khoi", "grade"],
  dateOfBirth: ["ngay sinh", "dob", "date of birth"],
  className: ["lop", "class"],
};

export interface RawRow {
  fullName: string;
  studentCode: string;
  grade: string;
  dateOfBirth: string;
  className: string;
}

export interface ParsedFile {
  rows: (RawRow & { line: number })[];
  /** Fatal problem with the file itself (no header, missing required columns, no data). */
  fileError?: string;
}

export function readImportFile(text: string): ParsedFile {
  const table = parseCsv(text).filter((r) => r.some((c) => c !== ""));
  if (table.length === 0) return { rows: [], fileError: "File trống." };

  const header = table[0].map(strip);
  const index = {} as Record<keyof RawRow, number>;
  (Object.keys(HEADER_ALIASES) as (keyof RawRow)[]).forEach((key) => {
    index[key] = header.findIndex((h) => HEADER_ALIASES[key].includes(h));
  });
  const missing = [
    index.fullName < 0 && "Họ và tên",
    index.studentCode < 0 && "Mã học sinh",
    index.grade < 0 && "Khối",
  ].filter(Boolean);
  if (missing.length) return { rows: [], fileError: `Thiếu cột bắt buộc: ${missing.join(", ")}. Hãy dùng file mẫu.` };

  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const rows = table.slice(1).map((r, k) => ({
    line: k + 2,
    fullName: get(r, index.fullName),
    studentCode: get(r, index.studentCode),
    grade: get(r, index.grade),
    dateOfBirth: get(r, index.dateOfBirth),
    className: get(r, index.className),
  }));
  if (rows.length === 0) return { rows: [], fileError: "File chỉ có dòng tiêu đề, chưa có học sinh." };
  return { rows };
}

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

export const normalizeClassName = (v: string) => strip(v).replace(/^lop\s*/, "").replace(/\s/g, "");

export type ImportMode = "file" | "class" | "none";

export interface ValidatedRow extends StudentImportRow {
  /** Class the row will be added to (when valid). */
  classId?: string;
}

export function validateRows(
  rows: ParsedFile["rows"],
  opts: { existingCodes: Set<string>; classes: Classroom[]; mode: ImportMode; targetClass?: Classroom },
): ValidatedRow[] {
  const byName = new Map(opts.classes.map((c) => [normalizeClassName(c.name), c]));
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const errors: string[] = [];
    const code = r.studentCode.toUpperCase();
    const grade = Number(r.grade);

    if (!r.fullName) errors.push("Thiếu họ và tên");
    if (!code) errors.push("Thiếu mã học sinh");
    else if (!/^[A-Z0-9_-]+$/.test(code)) errors.push("Mã học sinh chỉ gồm chữ không dấu, số, - và _");
    else if (opts.existingCodes.has(code)) errors.push("Mã học sinh đã tồn tại trong trường");
    else if (seen.has(code)) errors.push(`Trùng mã với dòng ${seen.get(code)}`);
    if (code && !seen.has(code)) seen.set(code, r.line);

    if (!r.grade || !Number.isInteger(grade) || grade < 6 || grade > 12) errors.push("Khối phải từ 6 đến 12");

    let dateOfBirth: string | undefined;
    if (r.dateOfBirth) {
      const parsed = parseDob(r.dateOfBirth);
      if (!parsed) errors.push("Ngày sinh không hợp lệ (dd/mm/yyyy)");
      else dateOfBirth = parsed;
    }

    let cls: Classroom | undefined;
    if (opts.mode === "file" && r.className) {
      cls = byName.get(normalizeClassName(r.className));
      if (!cls) errors.push(`Không tìm thấy lớp “${r.className}”`);
    } else if (opts.mode === "class") {
      cls = opts.targetClass;
    }
    if (cls && Number.isInteger(grade) && cls.grade !== grade) errors.push(`Khối ${grade} không khớp lớp ${cls.name} (khối ${cls.grade})`);

    return {
      line: r.line,
      fullName: r.fullName,
      studentCode: code,
      grade,
      dateOfBirth,
      className: cls?.name ?? (opts.mode === "file" ? r.className || undefined : undefined),
      classId: cls?.id,
      error: errors.length ? errors.join("; ") : undefined,
    };
  });
}

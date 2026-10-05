"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { StaffDataTable } from "@/components/staff/staff-data-table";
import { AccountStatusBadge, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { CONTENT_STATUS_LABELS, type ClassReportRow, type TeacherReportRow } from "@/features/saas/hooks-school";
import type { LocalContentStatus } from "@/features/saas/types";

const num = (v: number) => <span className="tabular-nums">{formatNumber(v)}</span>;
const muted = (text: string) => <span className="text-content-muted">{text}</span>;

/** Rows without data (null) sort as the lowest value. */
const nullsLast = (key: "submissionRate" | "avgTestScore" | "lastActivity") =>
  (a: { original: ClassReportRow }, b: { original: ClassReportRow }) => {
    const x = a.original[key];
    const y = b.original[key];
    if (x == null && y == null) return 0;
    if (x == null) return -1;
    if (y == null) return 1;
    return x < y ? -1 : x > y ? 1 : 0;
  };

export function SchoolClassReportTable({ rows }: { rows: ClassReportRow[] }) {
  const columns = React.useMemo<ColumnDef<ClassReportRow, unknown>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Lớp",
        cell: ({ row }) => (
          <Link href={ROUTES.SCHOOL.CLASS_DETAIL(row.original.id)} className="font-bold text-content-heading underline-offset-4 hover:text-[var(--accent-gold)] hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "homeroom",
        header: "GV chủ nhiệm",
        cell: ({ row }) =>
          row.original.homeroom || <span className="text-[var(--status-warning)]">Chưa phân công</span>,
      },
      { accessorKey: "students", header: "Sĩ số", cell: ({ row }) => num(row.original.students) },
      { accessorKey: "openAssignments", header: "Bài đang mở", cell: ({ row }) => num(row.original.openAssignments) },
      {
        accessorKey: "submissionRate",
        header: "Tỉ lệ nộp",
        sortingFn: nullsLast("submissionRate"),
        cell: ({ row }) => {
          const r = row.original.submissionRate;
          if (r == null) return muted("Chưa có bài");
          const pct = Math.round(r * 100);
          return (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-14 bg-[var(--status-neutral-bg)] ring-1 ring-inset ring-[var(--border-default)]">
                <span className="block h-full" style={{ width: `${pct}%`, background: "var(--jade)" }} />
              </span>
              <span className="tabular-nums">{pct}%</span>
            </span>
          );
        },
      },
      {
        accessorKey: "avgTestScore",
        header: "Điểm TB kiểm tra",
        sortingFn: nullsLast("avgTestScore"),
        cell: ({ row }) => {
          const s = row.original.avgTestScore;
          return s == null ? muted("—") : <span className="font-semibold tabular-nums">{s.toFixed(1)}</span>;
        },
      },
      {
        accessorKey: "lastActivity",
        header: "Hoạt động gần nhất",
        sortingFn: nullsLast("lastActivity"),
        cell: ({ row }) => (row.original.lastActivity ? <span className="tabular-nums">{formatDate(row.original.lastActivity)}</span> : muted("Chưa có")),
      },
    ],
    [],
  );
  return <StaffDataTable columns={columns} data={rows} emptyMessage="Trường chưa có lớp nào." />;
}

const STATUS_ORDER: LocalContentStatus[] = ["PUBLISHED", "PENDING", "DRAFT", "INACTIVE", "TRASH"];

export function SchoolTeacherActivityTable({ rows }: { rows: TeacherReportRow[] }) {
  const columns = React.useMemo<ColumnDef<TeacherReportRow, unknown>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Giáo viên",
        cell: ({ row }) => <span className="font-semibold text-content-heading">{row.original.name}</span>,
      },
      { accessorKey: "status", header: "Tài khoản", cell: ({ row }) => <AccountStatusBadge status={row.original.status} /> },
      { accessorKey: "assignments30d", header: "Bài giao (30 ngày)", cell: ({ row }) => num(row.original.assignments30d) },
      {
        id: "content",
        header: "Nội dung địa phương",
        accessorFn: (r) => STATUS_ORDER.reduce((s, k) => s + r.content[k], 0),
        cell: ({ row }) => {
          const parts = STATUS_ORDER.filter((k) => row.original.content[k] > 0);
          if (!parts.length) return muted("Chưa soạn");
          return (
            <span className="text-xs">
              {parts.map((k, i) => (
                <React.Fragment key={k}>
                  {i > 0 && <span className="text-content-muted"> · </span>}
                  <span className="tabular-nums font-semibold">{row.original.content[k]}</span> {CONTENT_STATUS_LABELS[k].toLowerCase()}
                </React.Fragment>
              ))}
            </span>
          );
        },
      },
      {
        id: "classes",
        header: "Lớp phụ trách",
        accessorFn: (r) => r.classes.length,
        cell: ({ row }) => (row.original.classes.length ? row.original.classes.join(", ") : muted("Chưa phân công")),
      },
    ],
    [],
  );
  return <StaffDataTable columns={columns} data={rows} emptyMessage="Trường chưa có giáo viên." />;
}

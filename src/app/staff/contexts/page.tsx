"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ScrollText, Search, Plus, Pencil, Trash2 } from "lucide-react";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { includesLoose, newId, nowLabel } from "@/components/staff/staff-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type HistoricalContextItem = {
  id: string;
  title: string;
  era: string;
  summary: string;
  updatedAt: string;
};

export default function StaffContextsPage() {
  const [items, setItems] = React.useState<HistoricalContextItem[]>([
    {
      id: "ctx_ww2",
      title: "Thế chiến II",
      era: "1939–1945",
      summary: "Tổng quan các mặt trận chính, bối cảnh chính trị và hệ quả toàn cầu.",
      updatedAt: "02/03/2026",
    },
    {
      id: "ctx_nguyen",
      title: "Triều Nguyễn",
      era: "1802–1945",
      summary: "Giai đoạn triều đại phong kiến cuối cùng ở Việt Nam, cải cách và biến động.",
      updatedAt: "28/02/2026",
    },
    {
      id: "ctx_fr",
      title: "Cách mạng Pháp",
      era: "1789",
      summary: "Phong trào lật đổ chế độ phong kiến, ảnh hưởng tư tưởng và chính trị châu Âu.",
      updatedAt: "25/02/2026",
    },
  ]);

  const [search, setSearch] = React.useState("");
  const [filtered, setFiltered] = React.useState(items);

  React.useEffect(() => {
    const q = search.trim();
    if (!q) return setFiltered(items);
    setFiltered(
      items.filter(
        (x) =>
          includesLoose(x.title, q) ||
          includesLoose(x.era, q) ||
          includesLoose(x.summary, q)
      )
    );
  }, [search, items]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<{
    id?: string;
    title: string;
    era: string;
    summary: string;
  }>({ title: "", era: "", summary: "" });

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<HistoricalContextItem | null>(null);

  const columns = React.useMemo<ColumnDef<HistoricalContextItem>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => (
          <div className="min-w-[260px]">
            <p className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
              {row.original.title}
            </p>
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--content-muted)" }}>
              {row.original.summary}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "era",
        header: "Giai đoạn",
        cell: ({ row }) => (
          <span className="text-xs font-medium" style={{ color: "var(--content-text)" }}>
            {row.original.era}
          </span>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {row.original.updatedAt}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => {
                setMode("edit");
                setDraft({
                  id: row.original.id,
                  title: row.original.title,
                  era: row.original.era,
                  summary: row.original.summary,
                });
                setDialogOpen(true);
              }}
              style={{ color: "var(--header-text-muted)" }}
              aria-label="Sửa"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => {
                setDeleteTarget(row.original);
                setDeleteOpen(true);
              }}
              style={{ color: "var(--accent-danger)" }}
              aria-label="Xóa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, []);

  return (
    <StaffShell
      title="Manage Historical Context"
      description="Tạo, cập nhật và kiểm soát bối cảnh lịch sử."
      icon={ScrollText}
      accent="var(--accent-gold)"
    >
      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--content-heading)", fontFamily: "'Georgia', serif" }}
            >
              Danh sách bối cảnh
            </h2>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              Search realtime + CRUD (mock) để mô phỏng workflow quản trị.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-[340px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--content-subtle)" }}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, giai đoạn, mô tả..."
                className="pl-10 h-10 rounded-xl border"
                style={{
                  background: "rgba(27, 38, 50, 0.05)",
                  borderColor: "var(--card-light-border)",
                  color: "var(--content-text)",
                }}
              />
            </div>
            <Button
              type="button"
              className="h-10 rounded-xl px-4 font-semibold border-0"
              onClick={() => {
                setMode("create");
                setDraft({ title: "", era: "", summary: "" });
                setDialogOpen(true);
              }}
              style={{
                background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
                boxShadow: "0 0 14px var(--accent-gold-glow)",
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add New
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <StaffDataTable
            columns={columns}
            data={filtered}
            emptyMessage="Không tìm thấy bối cảnh phù hợp."
          />
          <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
            Hiển thị {filtered.length} / {items.length} bản ghi
          </p>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px]" style={{ borderColor: "var(--card-light-border)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--content-heading)" }}>
              {mode === "create" ? "Add Historical Context" : "Edit Historical Context"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              Thông tin dùng để hiển thị bối cảnh và làm dữ liệu cho trải nghiệm tương tác.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ctx-title">Tiêu đề</Label>
              <Input
                id="ctx-title"
                value={draft.title}
                onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
                placeholder="VD: Thế chiến II"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ctx-era">Giai đoạn</Label>
              <Input
                id="ctx-era"
                value={draft.era}
                onChange={(e) => setDraft((s) => ({ ...s, era: e.target.value }))}
                placeholder="VD: 1939–1945"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ctx-summary">Tóm tắt</Label>
              <Textarea
                id="ctx-summary"
                value={draft.summary}
                onChange={(e) => setDraft((s) => ({ ...s, summary: e.target.value }))}
                placeholder="Mô tả ngắn gọn, tập trung vào bối cảnh và ý nghĩa."
                className="min-h-[110px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const title = draft.title.trim();
                if (!title) return;

                if (mode === "create") {
                  const next: HistoricalContextItem = {
                    id: newId(),
                    title,
                    era: draft.era.trim(),
                    summary: draft.summary.trim(),
                    updatedAt: nowLabel(),
                  };
                  setItems((prev) => [next, ...prev]);
                } else {
                  const id = draft.id;
                  if (!id) return;
                  setItems((prev) =>
                    prev.map((x) =>
                      x.id === id
                        ? {
                            ...x,
                            title,
                            era: draft.era.trim(),
                            summary: draft.summary.trim(),
                            updatedAt: nowLabel(),
                          }
                        : x
                    )
                  );
                }

                setDialogOpen(false);
              }}
              disabled={!draft.title.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent style={{ borderColor: "var(--card-light-border)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--content-heading)" }}>
              Xóa bối cảnh lịch sử?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--content-muted)" }}>
              Thao tác này sẽ xóa bản ghi khỏi danh sách mock trên frontend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                const target = deleteTarget;
                if (!target) return;
                setItems((prev) => prev.filter((x) => x.id !== target.id));
                setDeleteTarget(null);
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaffShell>
  );
}


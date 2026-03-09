"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardTextIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from "@phosphor-icons/react";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { includesLoose, newId, nowLabel } from "@/components/staff/staff-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type QuizItem = {
  id: string;
  title: string;
  topic: string;
  questions: number;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  updatedAt: string;
};

function difficultyBadge(d: QuizItem["difficulty"]) {
  const color =
    d === "Dễ"
      ? "var(--accent-teal)"
      : d === "Khó"
        ? "var(--accent-danger)"
        : "var(--accent-gold)";
  const bg =
    d === "Dễ"
      ? "rgba(47,111,115,0.12)"
      : d === "Khó"
        ? "rgba(184,50,42,0.10)"
        : "rgba(201,162,77,0.12)";
  return { color, bg };
}

export default function StaffQuizzesPage() {
  const [items, setItems] = React.useState<QuizItem[]>([
    {
      id: "q_ww2",
      title: "Chiến tranh thế giới thứ II",
      topic: "Chiến tranh",
      questions: 20,
      difficulty: "Trung bình",
      updatedAt: "02/03/2026",
    },
    {
      id: "q_nguyen",
      title: "Triều đại nhà Nguyễn",
      topic: "Việt Nam",
      questions: 15,
      difficulty: "Dễ",
      updatedAt: "28/02/2026",
    },
    {
      id: "q_fr",
      title: "Cách mạng Pháp 1789",
      topic: "Châu Âu",
      questions: 10,
      difficulty: "Khó",
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
          includesLoose(x.topic, q) ||
          includesLoose(x.difficulty, q) ||
          String(x.questions).includes(q)
      )
    );
  }, [search, items]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<{
    id?: string;
    title: string;
    topic: string;
    questions: number;
    difficulty: QuizItem["difficulty"];
  }>({ title: "", topic: "", questions: 10, difficulty: "Dễ" });

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<QuizItem | null>(null);

  const columns = React.useMemo<ColumnDef<QuizItem>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Bài quiz",
        cell: ({ row }) => (
          <div className="min-w-[280px]">
            <p className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
              {row.original.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
              {row.original.topic} · {row.original.questions} câu
            </p>
          </div>
        ),
      },
      {
        accessorKey: "difficulty",
        header: "Độ khó",
        cell: ({ row }) => {
          const { color, bg } = difficultyBadge(row.original.difficulty);
          return (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: bg, color }}
            >
              {row.original.difficulty}
            </span>
          );
        },
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
                  topic: row.original.topic,
                  questions: row.original.questions,
                  difficulty: row.original.difficulty,
                });
                setDialogOpen(true);
              }}
              style={{ color: "var(--header-text-muted)" }}
              aria-label="Sửa"
            >
              <PencilIcon className="h-4 w-4" />
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
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, []);

  return (
    <StaffShell
      title="Manage Quizzes"
      description="Quản lý quiz theo chủ đề và độ khó."
      icon={ClipboardTextIcon}
      accent="var(--burning-flame)"
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
              Danh sách quiz
            </h2>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              Search realtime + CRUD (mock) để mô phỏng workflow quản trị.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-[340px]">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--content-subtle)" }}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, chủ đề, độ khó..."
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
                setDraft({ title: "", topic: "", questions: 10, difficulty: "Dễ" });
                setDialogOpen(true);
              }}
              style={{
                background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
                boxShadow: "0 0 14px var(--accent-gold-glow)",
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Add New
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <StaffDataTable columns={columns} data={filtered} emptyMessage="Không tìm thấy quiz phù hợp." />
          <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
            Hiển thị {filtered.length} / {items.length} bản ghi
          </p>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px]" style={{ borderColor: "var(--card-light-border)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--content-heading)" }}>
              {mode === "create" ? "Add Quiz" : "Edit Quiz"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              Tạo/điều chỉnh quiz để kiểm tra kiến thức theo chủ đề và độ khó.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="q-title">Tiêu đề</Label>
              <Input
                id="q-title"
                value={draft.title}
                onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
                placeholder="VD: Đế chế La Mã"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="q-topic">Chủ đề</Label>
                <Input
                  id="q-topic"
                  value={draft.topic}
                  onChange={(e) => setDraft((s) => ({ ...s, topic: e.target.value }))}
                  placeholder="VD: Châu Âu"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="q-questions">Số câu</Label>
                <Input
                  id="q-questions"
                  type="number"
                  min={1}
                  value={draft.questions}
                  onChange={(e) =>
                    setDraft((s) => ({
                      ...s,
                      questions: Number(e.target.value || 0),
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Độ khó</Label>
              <div className="flex flex-wrap gap-2">
                {(["Dễ", "Trung bình", "Khó"] as const).map((d) => {
                  const active = draft.difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      className="px-3 py-2 rounded-xl text-sm font-semibold border transition-colors"
                      onClick={() => setDraft((s) => ({ ...s, difficulty: d }))}
                      style={
                        active
                          ? {
                              background: "var(--accent-gold-active-bg)",
                              borderColor: "var(--card-light-border)",
                              color: "var(--content-heading)",
                            }
                          : {
                              background: "transparent",
                              borderColor: "var(--card-light-border)",
                              color: "var(--content-muted)",
                            }
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
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
                const topic = draft.topic.trim();
                const questions = Math.max(1, Number(draft.questions || 1));

                if (mode === "create") {
                  const next: QuizItem = {
                    id: newId(),
                    title,
                    topic,
                    questions,
                    difficulty: draft.difficulty,
                    updatedAt: nowLabel(),
                  };
                  setItems((prev) => [next, ...prev]);
                } else {
                  const id = draft.id;
                  if (!id) return;
                  setItems((prev) =>
                    prev.map((x) =>
                      x.id === id
                        ? { ...x, title, topic, questions, difficulty: draft.difficulty, updatedAt: nowLabel() }
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
            <AlertDialogTitle style={{ color: "var(--content-heading)" }}>Xóa quiz?</AlertDialogTitle>
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


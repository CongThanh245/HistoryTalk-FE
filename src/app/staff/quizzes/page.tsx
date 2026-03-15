"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardTextIcon, PencilIcon, TrashIcon, ArrowLeftIcon,
  TimerIcon, GameControllerIcon, TagIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffSearchBar } from "@/components/staff/staff-search-bar";
import { StaffConfirmDialog } from "@/components/staff/staff-confirm-dialog";
import { EraBadge, GradeBadge, ERA_OPTIONS, type EraKey } from "@/components/staff/staff-badge";
import { QuizQuestionEditor, type QuizQuestion } from "@/components/staff/quiz-question-editor";
import { includesLoose, newId, nowLabel } from "@/components/staff/staff-utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizSet {
  quizId: string; title: string; description: string;
  /** null = not tied to a specific school grade (extra-curricular) */
  grade: 10 | 11 | 12 | null; chapterNumber: number; chapterTitle: string;
  era: EraKey; durationSeconds: number;
  tags: string[]; playCount: number; rating: number;
  createdAt: string; updatedAt: string; createdBy: string;
  questions: QuizQuestion[];
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED: QuizSet[] = [
  {
    quizId: "ls12-b1", title: "Lịch sử 12 — Bài 1: Liên Hợp Quốc",
    description: "Kiểm tra kiến thức về sự thành lập và vai trò của Liên Hợp Quốc sau Chiến tranh thế giới thứ II.",
    grade: 12, chapterNumber: 1, chapterTitle: "Liên Hợp Quốc",
    era: "CONTEMPORARY", durationSeconds: 900,
    playCount: 3241, rating: 4.8, createdAt: "10/01/2024", updatedAt: "15/02/2024", createdBy: "staff_01",
    tags: ["liên hợp quốc", "lớp 12", "hiện đại"],
    questions: [
      { questionId: "q1-1", orderIndex: 1, content: "Liên Hợp Quốc được thành lập vào năm nào?", options: ["1944", "1945", "1946", "1947"], correctAnswer: 1, explanation: "LHQ chính thức thành lập ngày 24/10/1945." },
      { questionId: "q1-2", orderIndex: 2, content: "Trụ sở chính của Liên Hợp Quốc đặt tại thành phố nào?", options: ["Washington D.C.", "Geneva", "New York", "London"], correctAnswer: 2, explanation: "Trụ sở LHQ đặt tại New York, Mỹ." },
      { questionId: "q1-3", orderIndex: 3, content: "Cơ quan nào của LHQ có quyền quyết định cao nhất về hòa bình và an ninh quốc tế?", options: ["Đại Hội đồng", "Hội đồng Bảo an", "Tòa án Quốc tế", "Ban Thư ký"], correctAnswer: 1, explanation: "Hội đồng Bảo an là cơ quan quyền lực nhất của LHQ về hòa bình và an ninh." },
    ],
  },
  {
    quizId: "ls11-b3", title: "Lịch sử 11 — Bài 3: Chiến tranh thế giới thứ nhất",
    description: "Nguyên nhân, diễn biến và hậu quả của Chiến tranh thế giới thứ nhất (1914–1918).",
    grade: 11, chapterNumber: 3, chapterTitle: "Chiến tranh thế giới thứ nhất",
    era: "MODERN", durationSeconds: 1200,
    playCount: 2105, rating: 4.5, createdAt: "20/02/2024", updatedAt: "28/02/2024", createdBy: "staff_02",
    tags: ["ww1", "chiến tranh", "lớp 11", "cận đại"],
    questions: [
      { questionId: "q3-1", orderIndex: 1, content: "Chiến tranh thế giới thứ nhất bùng nổ năm nào?", options: ["1912", "1913", "1914", "1915"], correctAnswer: 2, explanation: "Chiến tranh bùng nổ ngày 28/7/1914." },
      { questionId: "q3-2", orderIndex: 2, content: "Sự kiện trực tiếp châm ngòi Chiến tranh thế giới thứ nhất là gì?", options: ["Đức xâm lược Bỉ", "Nga tổng động viên quân đội", "Vụ ám sát Thái tử Áo-Hung Franz Ferdinand", "Anh tuyên chiến với Đức"], correctAnswer: 2, explanation: "Vụ ám sát tại Sarajevo ngày 28/6/1914." },
      { questionId: "q3-3", orderIndex: 3, content: "Chiến tranh thế giới thứ nhất kết thúc vào năm nào?", options: ["1917", "1918", "1919", "1920"], correctAnswer: 1, explanation: "Chiến tranh kết thúc ngày 11/11/1918." },
      { questionId: "q3-4", orderIndex: 4, content: "Hiệp ước nào chính thức chấm dứt Chiến tranh thế giới thứ nhất?", options: ["Hiệp ước Versailles", "Hiệp ước Saint-Germain", "Hiệp ước Brest-Litovsk", "Hiệp ước Trianon"], correctAnswer: 0, explanation: "Hiệp ước Versailles (1919) kết thúc chiến tranh với Đức." },
    ],
  },
  {
    quizId: "ls10-b5", title: "Lịch sử 10 — Bài 5: Các quốc gia phong kiến Đông Nam Á",
    description: "Sự hình thành và phát triển của các vương quốc phong kiến khu vực Đông Nam Á từ thế kỷ X–XV.",
    grade: 10, chapterNumber: 5, chapterTitle: "Các quốc gia phong kiến Đông Nam Á",
    era: "MEDIEVAL", durationSeconds: 1500,
    playCount: 987, rating: 4.2, createdAt: "05/03/2024", updatedAt: "10/03/2024", createdBy: "staff_01",
    tags: ["đông nam á", "phong kiến", "lớp 10", "trung đại"],
    questions: [
      { questionId: "q5-1", orderIndex: 1, content: "Đế quốc Khmer (Angkor) nằm trên lãnh thổ quốc gia nào ngày nay?", options: ["Thái Lan", "Việt Nam", "Campuchia", "Myanmar"], correctAnswer: 2, explanation: "Đế quốc Khmer là tiền thân của Campuchia ngày nay." },
      { questionId: "q5-2", orderIndex: 2, content: "Đại Việt thời Lý–Trần đối phó thành công với cuộc xâm lược nào?", options: ["Quân Tống", "Quân Mông–Nguyên", "Quân Chiêm Thành", "Quân Xiêm"], correctAnswer: 1, explanation: "Đại Việt 3 lần kháng chiến chống quân Mông–Nguyên (1258, 1285, 1288)." },
      { questionId: "q5-3", orderIndex: 3, content: "Công trình kiến trúc tiêu biểu nhất của đế quốc Angkor còn lại đến ngày nay?", options: ["Borobudur", "Angkor Wat", "Pagan", "Bagan"], correctAnswer: 1, explanation: "Angkor Wat là đền thờ lớn nhất thế giới, xây thế kỷ XII." },
      { questionId: "q5-4", orderIndex: 4, content: "Triều đại nào xây dựng Kinh thành Thăng Long (Hà Nội ngày nay)?", options: ["Triều Ngô", "Triều Đinh", "Triều Lý", "Triều Trần"], correctAnswer: 2, explanation: "Năm 1010, Lý Thái Tổ dời đô về Thăng Long." },
      { questionId: "q5-5", orderIndex: 5, content: "Đặc điểm nổi bật của kinh tế Đông Nam Á thời phong kiến là gì?", options: ["Công nghiệp dệt may phát triển", "Thương mại đường biển và nền văn minh lúa nước", "Khai thác mỏ và luyện kim", "Chăn nuôi du mục là chủ yếu"], correctAnswer: 1, explanation: "Khu vực Đông Nam Á nổi tiếng với văn minh lúa nước và thương mại biển." },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyDraft = () => ({ title: "", description: "", grade: null as 10|11|12|null, chapterNumber: 1, chapterTitle: "", era: "CONTEMPORARY" as EraKey, durationSeconds: 900, tags: [] as string[], questions: [] as QuizQuestion[] });
type DraftState = ReturnType<typeof emptyDraft> & { quizId?: string };

const fmtDuration = (s: number) => { const m = Math.floor(s / 60); return m > 0 ? `${m} phút` : `${s}s`; };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><Label className="text-xs font-semibold" style={{ color: "var(--content-subtle)" }}>{label}</Label>{children}</div>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffQuizzesPage() {
  const [items, setItems] = React.useState<QuizSet[]>(SEED);
  const [search, setSearch] = React.useState("");
  const [filterGrade, setFilterGrade] = React.useState<""|"10"|"11"|"12">("");
  const [view, setView] = React.useState<"list"|"editor">("list");
  const [editorMode, setEditorMode] = React.useState<"create"|"edit">("create");
  const [draft, setDraft] = React.useState<DraftState>(emptyDraft());
  const [tagInput, setTagInput] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<QuizSet | null>(null);

  // Filtered list
  const filtered = React.useMemo(() => {
    let list = items;
    if (search.trim()) { const q = search.trim(); list = list.filter((x) => includesLoose(x.title, q) || includesLoose(x.chapterTitle, q) || x.tags.some((t) => includesLoose(t, q))); }
    if (filterGrade) list = list.filter((x) => String(x.grade) === filterGrade);
    return list;
  }, [items, search, filterGrade]);

  const openCreate = () => { setDraft(emptyDraft()); setTagInput(""); setEditorMode("create"); setView("editor"); };
  const openEdit = (q: QuizSet) => { setDraft({ ...q }); setTagInput(""); setEditorMode("edit"); setView("editor"); };

  const handleSave = () => {
    const title = draft.title.trim(); const chapterTitle = draft.chapterTitle.trim();
    if (!title || !chapterTitle) return;
    if (editorMode === "create") {
      const next: QuizSet = { quizId: newId(), title, description: draft.description.trim(), grade: draft.grade, chapterNumber: draft.chapterNumber, chapterTitle, era: draft.era, durationSeconds: draft.durationSeconds, tags: draft.tags, questions: draft.questions, playCount: 0, rating: 0, createdAt: nowLabel(), updatedAt: nowLabel(), createdBy: "staff_me" };
      setItems((p) => [next, ...p]);
      toast.success(`Đã tạo quiz "${title}" với ${draft.questions.length} câu hỏi.`);
    } else {
      setItems((p) => p.map((x) => x.quizId === draft.quizId ? { ...x, title, description: draft.description.trim(), grade: draft.grade, chapterNumber: draft.chapterNumber, chapterTitle, era: draft.era, durationSeconds: draft.durationSeconds, tags: draft.tags, questions: draft.questions, updatedAt: nowLabel() } : x));
      toast.success(`Đã cập nhật quiz "${title}".`);
    }
    setView("list");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setItems((p) => p.filter((x) => x.quizId !== deleteTarget.quizId));
    toast.success(`Đã xóa quiz "${deleteTarget.title}".`);
    setDeleteTarget(null);
  };

  const addTag = () => { const t = tagInput.trim().toLowerCase(); if (!t || draft.tags.includes(t)) { setTagInput(""); return; } setDraft((s) => ({ ...s, tags: [...s.tags, t] })); setTagInput(""); };
  const removeTag = (t: string) => setDraft((s) => ({ ...s, tags: s.tags.filter((x) => x !== t) }));

  // Table columns
  const columns = React.useMemo<ColumnDef<QuizSet>[]>(() => [
    { accessorKey: "title", header: "Bài quiz", cell: ({ row: r }) => <div className="min-w-[240px]"><p className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>{r.original.title}</p><p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>Bài {r.original.chapterNumber}: {r.original.chapterTitle}</p></div> },
    { id: "meta", header: "Phân loại", cell: ({ row: r }) => <div className="flex items-center gap-1.5 flex-wrap">{r.original.grade && <GradeBadge value={r.original.grade} />}<EraBadge value={r.original.era} /></div> },
    { id: "stats", header: "Thống kê", cell: ({ row: r }) => <div><p className="text-xs" style={{ color: "var(--content-text)" }}>{r.original.questions.length} câu · {fmtDuration(r.original.durationSeconds)}</p><p className="text-xs" style={{ color: "var(--content-muted)" }}>{r.original.playCount.toLocaleString()} lượt chơi</p></div> },
    { accessorKey: "updatedAt", header: "Cập nhật", cell: ({ row: r }) => <span className="text-xs" style={{ color: "var(--content-muted)" }}>{r.original.updatedAt}</span> },
    { id: "actions", header: "Thao tác", cell: ({ row: r }) => <div className="flex items-center justify-end gap-1"><Button type="button" variant="ghost" size="icon-sm" className="rounded-full" onClick={() => openEdit(r.original)} style={{ color: "var(--header-text-muted)" }}><PencilIcon className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon-sm" className="rounded-full" onClick={() => setDeleteTarget(r.original)} style={{ color: "var(--accent-danger)" }}><TrashIcon className="h-4 w-4" /></Button></div> },
  ], []);

  // Filter chips JSX
  const filterChips = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(["", "10", "11", "12"] as const).map((g) => (
        <button key={g || "all"} type="button" onClick={() => setFilterGrade(g)}
          className="px-3 h-8 rounded-lg text-xs font-semibold border transition-all"
          style={filterGrade === g ? { background: "var(--accent-gold-active-bg)", borderColor: "var(--accent-gold)", color: "var(--content-heading)" } : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }}>
          {g ? `Lớp ${g}` : "Tất cả"}
        </button>
      ))}
    </div>
  );

  // ═══ EDITOR VIEW ══════════════════════════════════════════════════════════
  if (view === "editor") {
    const canSave = draft.title.trim() && draft.chapterTitle.trim();
    return (
      <StaffShell title={editorMode === "create" ? "Tạo Quiz mới" : "Chỉnh sửa Quiz"} description={editorMode === "create" ? "Điền metadata và thêm câu hỏi." : `Đang chỉnh sửa: ${draft.title}`} icon={ClipboardTextIcon} accent="var(--burning-flame)">
        <button type="button" onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity" style={{ color: "var(--content-muted)" }}>
          <ArrowLeftIcon className="h-4 w-4" /> Quay lại danh sách
        </button>

        <div className="grid grid-cols-[380px_1fr] gap-6 items-start">
          {/* ── Metadata panel ── */}
          <div className="rounded-2xl border p-6 space-y-4 sticky top-6" style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--content-subtle)" }}>Thông tin bộ quiz</h2>

            <Field label="Tiêu đề *"><Input value={draft.title} onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))} placeholder="VD: Lịch sử 12 — Bài 1: Liên Hợp Quốc" /></Field>
            <Field label="Mô tả"><Textarea value={draft.description} onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))} placeholder="Mô tả ngắn về bộ quiz..." className="min-h-[60px] text-sm" /></Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Lớp (tuỳ chọn)">
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setDraft((s) => ({ ...s, grade: null }))}
                    className="flex-1 h-9 rounded-lg border text-sm font-semibold transition-all"
                    style={draft.grade === null ? { background: "rgba(100,100,100,0.15)", borderColor: "var(--content-muted)", color: "var(--content-text)" } : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }}>
                    —
                  </button>
                  {([10, 11, 12] as const).map((g) => (
                    <button key={g} type="button" onClick={() => setDraft((s) => ({ ...s, grade: g }))}
                      className="flex-1 h-9 rounded-lg border text-sm font-semibold transition-all"
                      style={draft.grade === g ? { background: "rgba(59,130,246,0.15)", borderColor: "var(--accent-blue)", color: "var(--accent-blue)" } : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }}>
                      {g}
                    </button>
                  ))}
                </div>
                {draft.grade === null && <p className="text-[10px] mt-1" style={{ color: "var(--content-subtle)" }}>Không gắn lớp — dùng cho quiz ngoài chương trình.</p>}
              </Field>
              <Field label="Số bài"><Input type="number" min={1} max={99} value={draft.chapterNumber} onChange={(e) => setDraft((s) => ({ ...s, chapterNumber: Number(e.target.value) || 1 }))} className="h-9" /></Field>
            </div>

            <Field label="Tên chủ đề *"><Input value={draft.chapterTitle} onChange={(e) => setDraft((s) => ({ ...s, chapterTitle: e.target.value }))} placeholder="VD: Liên Hợp Quốc" /></Field>

            <Field label="Thời đại lịch sử">
              <Select value={draft.era} onValueChange={(v) => setDraft((s) => ({ ...s, era: v as EraKey }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ERA_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>


            <Field label={`Thời gian gợi ý (giây) — ${fmtDuration(draft.durationSeconds)}`}>
              <Input type="number" min={60} step={60} value={draft.durationSeconds} onChange={(e) => setDraft((s) => ({ ...s, durationSeconds: Number(e.target.value) || 600 }))} className="h-9" />
            </Field>

            <Field label="Tags">
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Nhập tag + Enter..." className="h-9 flex-1 text-sm" />
                <Button type="button" size="sm" variant="outline" className="h-9 px-3" onClick={addTag}><TagIcon className="h-3.5 w-3.5" /></Button>
              </div>
              {draft.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {draft.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-70 transition-opacity" style={{ background: "rgba(59,130,246,0.10)", color: "var(--accent-blue)" }} onClick={() => removeTag(t)}>{t} ×</span>
                  ))}
                </div>
              )}
            </Field>

            <div className="flex gap-2 pt-1">
              <Button type="button" className="flex-1 font-semibold border-0" disabled={!canSave} onClick={handleSave} style={{ background: "linear-gradient(135deg, var(--burning-flame) 0%, var(--accent-gold) 100%)", color: "#fff" }}>
                {editorMode === "create" ? "Tạo Quiz" : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setView("list")}>Hủy</Button>
            </div>
          </div>

          {/* ── Question panel ── */}
          <div className="rounded-2xl border p-6" style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
            <div className="flex items-center gap-4 mb-5 pb-4 border-b" style={{ borderColor: "var(--card-light-border)" }}>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--content-muted)" }}><ClipboardTextIcon className="h-4 w-4" /><span>{draft.questions.length} câu hỏi</span></div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--content-muted)" }}><TimerIcon className="h-4 w-4" /><span>{fmtDuration(draft.durationSeconds)}</span></div>
            </div>
            <QuizQuestionEditor
              questions={draft.questions}
              onChange={(qs) => setDraft((s) => ({ ...s, questions: qs }))}
              onImportError={(msg) => toast.error(msg)}
              onImportSuccess={(n) => toast.success(`Đã import ${n} câu hỏi.`)}
            />
          </div>
        </div>
      </StaffShell>
    );
  }

  // ═══ LIST VIEW ═══════════════════════════════════════════════════════════
  return (
    <StaffShell title="Manage Quizzes" description="Quản lý bộ câu hỏi lịch sử theo lớp, bài và độ khó." icon={ClipboardTextIcon} accent="var(--burning-flame)">
      <section className="rounded-2xl border p-6 space-y-5" style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: "Tổng bộ quiz", value: items.length, icon: ClipboardTextIcon, color: "var(--burning-flame)" },
            { label: "Tổng câu hỏi", value: items.reduce((a, x) => a + x.questions.length, 0), icon: ClipboardTextIcon, color: "var(--accent-teal)" },
            { label: "Tổng lượt chơi", value: items.reduce((a, x) => a + x.playCount, 0).toLocaleString(), icon: GameControllerIcon, color: "var(--accent-blue)" },
          ] as const).map((s) => { const Icon = s.icon; return (
            <div key={s.label} className="rounded-xl border px-4 py-3 flex items-center gap-3" style={{ borderColor: "var(--card-light-border)", background: "rgba(27,38,50,0.04)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}><Icon className="w-4 h-4" style={{ color: s.color }} /></div>
              <div><p className="text-lg font-bold leading-none" style={{ color: "var(--content-heading)" }}>{s.value}</p><p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>{s.label}</p></div>
            </div>
          ); })}
        </div>

        <StaffSearchBar value={search} onChange={setSearch} placeholder="Tìm theo tiêu đề, chủ đề, tag..."
          actionLabel="Tạo Quiz" actionGradient="linear-gradient(135deg, var(--burning-flame) 0%, var(--accent-gold) 100%)" actionColor="#fff"
          onAction={openCreate} filters={filterChips} />

        <div className="space-y-2">
          <StaffDataTable columns={columns} data={filtered} emptyMessage="Không tìm thấy quiz phù hợp." />
          <p className="text-xs" style={{ color: "var(--content-subtle)" }}>Hiển thị {filtered.length} / {items.length} bộ quiz</p>
        </div>
      </section>

      <StaffConfirmDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Xóa quiz "${deleteTarget?.title}"?`} description="Bộ câu hỏi và toàn bộ dữ liệu liên quan sẽ bị xóa vĩnh viễn."
        onConfirm={handleDelete} />
    </StaffShell>
  );
}

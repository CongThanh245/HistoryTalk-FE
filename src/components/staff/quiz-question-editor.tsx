"use client";

import * as React from "react";
import {
  ArrowUpIcon, ArrowDownIcon, PencilIcon, TrashIcon,
  PlusIcon, UploadSimpleIcon, CheckCircleIcon, ClipboardTextIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { newId } from "./staff-utils";
import {
  parseJsonQuestions, parseCsvQuestions, parsePlainTextQuestions,
  type ImportedQuestion,
} from "./quiz-import-parser";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  questionId: string;
  orderIndex: number;
  content: string;
  options: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  explanation?: string;
}

interface QuizQuestionEditorProps {
  questions: QuizQuestion[];
  onChange: (qs: QuizQuestion[]) => void;
  onImportError?: (msg: string) => void;
  onImportSuccess?: (count: number) => void;
}

const LABELS = ["A", "B", "C", "D"] as const;
const makeEmpty = (): QuizQuestion => ({
  questionId: newId(), orderIndex: 0, content: "",
  options: ["", "", "", ""], correctAnswer: 0, explanation: "",
});
const reindex = (qs: QuizQuestion[]) => qs.map((q, i) => ({ ...q, orderIndex: i + 1 }));

function toQuizQuestion(q: ImportedQuestion): QuizQuestion {
  return { questionId: newId(), orderIndex: q.orderIndex, content: q.content, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation };
}

// ─── Paste Dialog ─────────────────────────────────────────────────────────────

const FORMAT_EXAMPLE = `Liên Hợp Quốc được thành lập năm nào?
A. 1944
B. 1945
C. 1946
D. 1947
*B
// LHQ chính thức thành lập ngày 24/10/1945.

---

Trụ sở chính của LHQ đặt tại thành phố nào?
A. Geneva
B. London
C. New York
D. Paris
*C`;

interface PasteDialogProps {
  startIndex: number;
  onClose: () => void;
  onImport: (qs: QuizQuestion[]) => void;
}

function PasteDialog({ startIndex, onClose, onImport }: PasteDialogProps) {
  const [text, setText] = React.useState("");
  const [previewCount, setPreviewCount] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handlePreview = () => {
    const result = parsePlainTextQuestions(text, startIndex);
    if (!result.ok) { setError(result.error); setPreviewCount(null); return; }
    setError(null);
    setPreviewCount(result.questions.length);
  };

  const handleImport = () => {
    const result = parsePlainTextQuestions(text, startIndex);
    if (!result.ok) { setError(result.error); return; }
    onImport(result.questions.map(toQuizQuestion));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col"
        style={{ borderColor: "var(--card-light-border)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--content-heading)" }}>
            📋 Dán văn bản — Bulk import câu hỏi
          </DialogTitle>
          <DialogDescription style={{ color: "var(--content-muted)" }}>
            Paste nhiều câu hỏi cùng lúc theo format dưới đây. Phân cách câu hỏi bằng{" "}
            <code className="px-1 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.08)" }}>---</code>{" "}
            hoặc dòng trống.
          </DialogDescription>
        </DialogHeader>

        {/* Format reference */}
        <details className="rounded-xl border overflow-hidden text-xs"
          style={{ borderColor: "var(--card-light-border)" }}>
          <summary className="px-3 py-2 cursor-pointer font-semibold select-none"
            style={{ color: "var(--content-subtle)", background: "rgba(27,38,50,0.06)" }}>
            📖 Xem format mẫu
          </summary>
          <pre className="px-3 py-3 overflow-x-auto leading-relaxed"
            style={{ color: "var(--content-muted)", background: "rgba(27,38,50,0.03)", fontFamily: "monospace" }}>
            {`Nội dung câu hỏi?\nA. Đáp án A\nB. Đáp án B\nC. Đáp án C\nD. Đáp án D\n*B          ← đáp án đúng (A/B/C/D)\n// Giải thích (tuỳ chọn)\n\n---\n\nCâu hỏi tiếp theo?\n...`}
          </pre>
        </details>

        {/* Textarea */}
        <div className="flex-1 grid gap-1.5 min-h-0">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold" style={{ color: "var(--content-subtle)" }}>
              Văn bản câu hỏi
            </Label>
            <button type="button" className="text-xs underline opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--accent-blue)" }}
              onClick={() => { setText(FORMAT_EXAMPLE); setError(null); setPreviewCount(null); }}>
              Dùng ví dụ mẫu
            </button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); setPreviewCount(null); }}
            placeholder={"Dán câu hỏi vào đây...\n\nVí dụ:\nLinh Hợp Quốc thành lập năm nào?\nA. 1944\nB. 1945\nC. 1946\nD. 1947\n*B"}
            className="min-h-[260px] font-mono text-xs resize-y"
            style={{ color: "var(--content-text)" }}
          />
        </div>

        {/* Feedback */}
        {error && (
          <div className="rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: "rgba(184,50,42,0.10)", color: "var(--accent-danger)", border: "1px solid rgba(184,50,42,0.20)" }}>
            ⚠ {error}
          </div>
        )}
        {previewCount !== null && !error && (
          <div className="rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: "rgba(47,111,115,0.10)", color: "var(--accent-teal)", border: "1px solid rgba(47,111,115,0.20)" }}>
            ✓ Tìm thấy <strong>{previewCount}</strong> câu hỏi hợp lệ — nhấn "Import" để thêm vào.
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="button" variant="outline" onClick={handlePreview} disabled={!text.trim()}>
            Kiểm tra
          </Button>
          <Button type="button" onClick={handleImport} disabled={!text.trim()}
            style={{ background: "linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-blue) 100%)", color: "#fff", border: "none" }}>
            Import {previewCount !== null ? `(${previewCount} câu)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline Question Form ─────────────────────────────────────────────────────

interface QFormProps {
  initial?: QuizQuestion;
  orderIndex: number;
  onSave: (q: QuizQuestion) => void;
  onCancel: () => void;
}

function QuestionForm({ initial, orderIndex, onSave, onCancel }: QFormProps) {
  const [draft, setDraft] = React.useState<QuizQuestion>(initial ?? { ...makeEmpty(), orderIndex });
  const setOpt = (i: number, v: string) =>
    setDraft((s) => { const o = [...s.options] as [string, string, string, string]; o[i] = v; return { ...s, options: o }; });
  const valid = draft.content.trim() && draft.options.every((o) => o.trim());

  return (
    <div className="rounded-xl border p-4 space-y-3"
      style={{ background: "rgba(27,38,50,0.06)", borderColor: "var(--card-light-border)" }}>
      {/* Content */}
      <div className="grid gap-1.5">
        <Label className="text-xs font-semibold" style={{ color: "var(--content-subtle)" }}>
          Nội dung câu hỏi *
        </Label>
        <Textarea value={draft.content}
          onChange={(e) => setDraft((s) => ({ ...s, content: e.target.value }))}
          placeholder="Nhập nội dung câu hỏi..." className="min-h-[72px] text-sm" />
      </div>

      {/* Options */}
      <div className="grid gap-2">
        <Label className="text-xs font-semibold" style={{ color: "var(--content-subtle)" }}>
          Đáp án — click ô tròn để đánh dấu đáp án đúng ✓
        </Label>
        <div className="grid gap-2">
          {LABELS.map((lbl, idx) => {
            const correct = draft.correctAnswer === idx;
            return (
              <div key={lbl} className="flex items-center gap-2">
                <button type="button"
                  onClick={() => setDraft((s) => ({ ...s, correctAnswer: idx as 0|1|2|3 }))}
                  className="shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                  title="Đánh dấu đáp án đúng"
                  style={correct
                    ? { borderColor: "var(--accent-teal)", background: "rgba(47,111,115,0.15)" }
                    : { borderColor: "var(--card-light-border)", background: "transparent" }
                  }>
                  {correct && <CheckCircleIcon className="w-4 h-4" weight="fill" style={{ color: "var(--accent-teal)" }} />}
                </button>
                <span className="shrink-0 w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center"
                  style={correct
                    ? { background: "rgba(47,111,115,0.15)", color: "var(--accent-teal)" }
                    : { background: "var(--card-light-border)", color: "var(--content-muted)" }
                  }>{lbl}</span>
                <Input value={draft.options[idx]} onChange={(e) => setOpt(idx, e.target.value)}
                  placeholder={`Đáp án ${lbl}...`} className="flex-1 h-9 text-sm"
                  style={correct ? { borderColor: "var(--accent-teal)", background: "rgba(47,111,115,0.06)" } : {}} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <div className="grid gap-1.5">
        <Label className="text-xs font-semibold" style={{ color: "var(--content-subtle)" }}>
          Giải thích (tuỳ chọn)
        </Label>
        <Input value={draft.explanation ?? ""}
          onChange={(e) => setDraft((s) => ({ ...s, explanation: e.target.value }))}
          placeholder="Lý do đáp án đúng..." className="h-9 text-sm" />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" className="px-4"
          disabled={!valid} onClick={() => valid && onSave({ ...draft })}>
          Lưu câu hỏi
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Hủy</Button>
      </div>
    </div>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({ q, idx, total, onEdit, onDelete, onMove }: {
  q: QuizQuestion; idx: number; total: number;
  onEdit: () => void; onDelete: () => void; onMove: (d: "up"|"down") => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border px-3 py-2.5 group transition-colors"
      style={{ borderColor: "var(--card-light-border)", background: "var(--card-light-bg)" }}>
      <span className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ background: "rgba(59,130,246,0.10)", color: "var(--accent-blue)" }}>
        {idx + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm line-clamp-2 leading-snug" style={{ color: "var(--content-text)" }}>{q.content}</p>
        <p className="text-xs mt-1" style={{ color: "var(--content-subtle)" }}>
          Đáp án:&nbsp;
          <span className="font-semibold" style={{ color: "var(--accent-teal)" }}>
            {LABELS[q.correctAnswer]}. {q.options[q.correctAnswer]}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-7 w-7"
          disabled={idx === 0} onClick={() => onMove("up")} title="Lên">
          <ArrowUpIcon className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-7 w-7"
          disabled={idx === total - 1} onClick={() => onMove("down")} title="Xuống">
          <ArrowDownIcon className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-7 w-7"
          onClick={onEdit} style={{ color: "var(--header-text-muted)" }} title="Sửa">
          <PencilIcon className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-7 w-7"
          onClick={onDelete} style={{ color: "var(--accent-danger)" }} title="Xóa">
          <TrashIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function QuizQuestionEditor({ questions, onChange, onImportError, onImportSuccess }: QuizQuestionEditorProps) {
  const [addingNew, setAddingNew] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleSaveNew = (q: QuizQuestion) => { onChange(reindex([...questions, q])); setAddingNew(false); };
  const handleSaveEdit = (u: QuizQuestion) => { onChange(reindex(questions.map((q) => q.questionId === u.questionId ? u : q))); setEditingId(null); };
  const handleDelete = (id: string) => onChange(reindex(questions.filter((q) => q.questionId !== id)));
  const handleMove = (id: string, dir: "up"|"down") => {
    const i = questions.findIndex((q) => q.questionId === id); if (i < 0) return;
    const next = [...questions]; const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; onChange(reindex(next));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = "";
    const raw = await file.text();
    const start = questions.length + 1;
    const result = file.name.endsWith(".csv") ? parseCsvQuestions(raw, start) : parseJsonQuestions(raw, start);
    if (!result.ok) { onImportError?.(result.error); return; }
    const imported = result.questions.map((q: ImportedQuestion) => toQuizQuestion(q));
    onChange(reindex([...questions, ...imported]));
    onImportSuccess?.(imported.length);
  };

  const handlePasteImport = (imported: QuizQuestion[]) => {
    setPasteOpen(false);
    onChange(reindex([...questions, ...imported]));
    onImportSuccess?.(imported.length);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
          Câu hỏi ({questions.length})
        </span>
        <div className="flex gap-2 flex-wrap">
          {/* Paste text */}
          <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-lg"
            onClick={() => setPasteOpen(true)}>
            <ClipboardTextIcon className="h-3.5 w-3.5" /> Dán văn bản
          </Button>

          {/* File import */}
          <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFile} />
          <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-lg"
            onClick={() => fileRef.current?.click()}>
            <UploadSimpleIcon className="h-3.5 w-3.5" /> Import JSON/CSV
          </Button>

          {/* Add single */}
          {!addingNew && (
            <Button type="button" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-lg border-none"
              onClick={() => { setEditingId(null); setAddingNew(true); }}
              style={{ background: "linear-gradient(135deg, var(--accent-teal) 0%, var(--accent-blue) 100%)", color: "#fff" }}>
              <PlusIcon className="h-3.5 w-3.5" /> Thêm 1 câu
            </Button>
          )}
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div key={q.questionId}>
            {editingId === q.questionId
              ? <QuestionForm initial={q} orderIndex={idx + 1}
                  onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
              : <QuestionRow q={q} idx={idx} total={questions.length}
                  onEdit={() => { setAddingNew(false); setEditingId(q.questionId); }}
                  onDelete={() => handleDelete(q.questionId)}
                  onMove={(d) => handleMove(q.questionId, d)} />
            }
          </div>
        ))}
        {addingNew && (
          <QuestionForm orderIndex={questions.length + 1}
            onSave={handleSaveNew} onCancel={() => setAddingNew(false)} />
        )}
        {!questions.length && !addingNew && (
          <div className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-10 gap-2"
            style={{ borderColor: "var(--card-light-border)" }}>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>Chưa có câu hỏi nào</p>
            <div className="flex gap-2 mt-1">
              <Button type="button" size="sm" variant="outline" className="rounded-lg"
                onClick={() => setPasteOpen(true)}>
                <ClipboardTextIcon className="h-3.5 w-3.5 mr-1" /> Dán văn bản
              </Button>
              <Button type="button" size="sm" variant="outline" className="rounded-lg"
                onClick={() => setAddingNew(true)}>
                <PlusIcon className="h-3.5 w-3.5 mr-1" /> Thêm câu hỏi
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Paste dialog */}
      {pasteOpen && (
        <PasteDialog
          startIndex={questions.length + 1}
          onClose={() => setPasteOpen(false)}
          onImport={handlePasteImport}
        />
      )}
    </div>
  );
}

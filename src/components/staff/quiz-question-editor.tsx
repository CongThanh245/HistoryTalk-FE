"use client";

import * as React from "react";
import {
  ArrowUp, ArrowDown, Pencil, Trash2,
  Plus, Upload, CheckCircle2, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
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
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-strong bg-bg-elevated text-content-heading">
        
        <DialogHeader className="px-8 pt-8 pb-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue via-accent-teal to-accent-gold opacity-60" />
          <DialogTitle className="text-2xl font-bold tracking-tight text-content-heading">
            Dán văn bản — Bulk import câu hỏi
          </DialogTitle>
          <DialogDescription className="text-sm mt-1.5 leading-relaxed text-content-muted">
            Paste nhiều câu hỏi cùng lúc theo định dạng chuẩn. Các câu hỏi được phân tách bằng dấu gạch ngang <code className="px-1.5 py-0.5 rounded bg-black/5 font-mono text-xs">---</code> hoặc một dòng trống.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-8 pb-8 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-black/10">
          {/* Format reference section */}
          <div className="rounded-2xl border border-card-light-border bg-[rgba(27,38,50,0.02)] overflow-hidden">
            <details className="group">
              <summary className="px-5 py-3.5 cursor-pointer font-semibold select-none flex items-center justify-between text-content-text hover:bg-black/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                  <span>Xem định dạng mẫu & Hướng dẫn</span>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 uppercase tracking-wider group-open:hidden">Xem</div>
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 uppercase tracking-wider hidden group-open:block">Đóng</div>
              </summary>
              <div className="px-5 pb-5 pt-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-bold underline decoration-accent-teal/30 underline-offset-4">Cấu trúc 1 câu hỏi:</p>
                    <ul className="space-y-1 opacity-80 list-disc pl-4">
                      <li>Dòng 1: Nội dung câu hỏi</li>
                      <li>Dòng 2-5: Đáp án A, B, C, D (bắt đầu bằng A., B., C., D.)</li>
                      <li>Dòng 6: Đáp án đúng (bắt đầu bằng *)</li>
                      <li>Dòng 7: Giải thích (tuỳ chọn, bắt đầu bằng //)</li>
                    </ul>
                  </div>
                  <pre className="p-4 rounded-xl font-mono text-[10px] leading-relaxed overflow-x-auto shadow-inner text-content-muted bg-white/40 border border-card-light-border">
                    {`Nội dung câu hỏi?\nA. Đáp án A\nB. Đáp án B\nC. Đáp án C\nD. Đáp án D\n*B\n// Giải thích tại đây...`}
                  </pre>
                </div>
              </div>
            </details>
          </div>

          {/* Textarea field */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold flex items-center gap-2 text-content-heading">
                Nội dung văn bản
                <span className="text-[10px] font-normal px-1.5 py-0.25 rounded-md bg-accent-blue/10 text-accent-blue border border-accent-blue/20">Soạn thảo</span>
              </Label>
              <button type="button" 
                className="text-xs font-semibold px-2 py-1 rounded-lg text-accent-blue hover:bg-accent-blue/10 transition-all"
                onClick={() => { setText(FORMAT_EXAMPLE); setError(null); setPreviewCount(null); }}>
                Dùng ví dụ mẫu
              </button>
            </div>
            <div className="relative group">
              <Textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setError(null); setPreviewCount(null); }}
                placeholder={"Dán các nội dung câu hỏi tại đây...\n\nVí dụ:\nLịch sử Việt Nam có bao nhiêu năm văn hiến?\nA. 1000\nB. 2000\nC. 3000\nD. 4000\n*D"}
                className="min-h-[300px] font-mono text-sm resize-none rounded-2xl p-6 transition-all border-2 shadow-inner leading-relaxed text-content-text bg-white/50 border-card-light-border"
              />
              <div className="absolute bottom-4 right-4 text-[10px] opacity-30 group-hover:opacity-60 pointer-events-none font-mono">
                {text.length} ký tự
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="min-h-[40px] animate-in fade-in slide-in-from-top-2 duration-300">
            {error && (
              <div className="rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 border shadow-sm bg-[rgba(184,50,42,0.08)] text-[#b8322a] border-[rgba(184,50,42,0.2)]">
                <div className="shrink-0 w-5 h-5 rounded-full bg-accent-danger/20 flex items-center justify-center text-accent-danger">!</div>
                {error}
              </div>
            )}
            {previewCount !== null && !error && (
              <div className="rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 border shadow-sm bg-[rgba(47,111,115,0.08)] text-accent-teal border-[rgba(47,111,115,0.2)]">
                <div className="shrink-0 w-5 h-5 rounded-full bg-accent-teal/20 flex items-center justify-center text-accent-teal font-bold">✓</div>
                Xác nhận: Tìm thấy <strong>{previewCount}</strong> câu hỏi hợp lệ.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-black/5 border-t border-card-light-border flex flex-row items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}
            className="rounded-xl font-semibold px-6 text-content-muted hover:bg-black/5">Hủy</Button>
          
          <Button type="button" variant="outline" onClick={handlePreview} disabled={!text.trim()}
            className="rounded-xl font-semibold px-6 border-2 border-card-light-border bg-transparent text-content-text transition-all hover:border-accent-blue/50">
            Kiểm tra
          </Button>

          <Button type="button" onClick={handleImport} disabled={!text.trim() || error !== null}
            className="rounded-xl font-bold px-8 shadow-lg hover:shadow-accent-teal/25 transition-all text-white active:scale-95 border-none bg-gradient-to-br from-accent-teal to-blue-500">
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
    <div className="rounded-2xl border border-card-light-border p-6 space-y-5 shadow-sm transition-all animate-in zoom-in-95 duration-200 bg-white/40 backdrop-blur-[10px]">
      
      {/* Content */}
      <div className="grid gap-2">
        <Label className="text-xs font-bold uppercase tracking-wider px-1 text-content-subtle">
          Nội dung câu hỏi *
        </Label>
        <Textarea value={draft.content}
          onChange={(e) => setDraft((s) => ({ ...s, content: e.target.value }))}
          placeholder="Nhập nội dung câu hỏi..." 
          className="min-h-[100px] text-sm rounded-xl border-2 focus:ring-0 transition-all border-black/5 bg-white/50" />
      </div>

      {/* Options */}
      <div className="grid gap-3">
        <Label className="text-xs font-bold uppercase tracking-wider px-1 text-content-subtle">
          Đáp án & Đáp án đúng ✓
        </Label>
        <div className="grid gap-2.5">
          {LABELS.map((lbl, idx) => {
            const correct = draft.correctAnswer === idx;
            return (
              <div key={lbl} className="flex items-center gap-3">
                <button type="button"
                  onClick={() => setDraft((s) => ({ ...s, correctAnswer: idx as 0 | 1 | 2 | 3 }))}
                  className={cn(
                    "shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-90",
                    correct
                      ? "border-accent-teal bg-accent-teal text-white"
                      : "border-card-light-border bg-white text-content-muted",
                  )}
                  title="Đánh dấu đáp án đúng">
                  {correct ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-bold">{lbl}</span>}
                </button>
                <Input value={draft.options[idx]} onChange={(e) => setOpt(idx, e.target.value)}
                  placeholder={`Đáp án ${lbl}...`} 
                  className={cn(
                    "flex-1 h-10 text-sm rounded-xl border-2 transition-all bg-white/50 border-black/5",
                    correct && "border-[rgba(47,111,115,0.3)] bg-white",
                  )} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <div className="grid gap-2">
        <Label className="text-xs font-bold uppercase tracking-wider px-1 text-content-subtle">
          Giải thích (tuỳ chọn)
        </Label>
        <Input value={draft.explanation ?? ""}
          onChange={(e) => setDraft((s) => ({ ...s, explanation: e.target.value }))}
          placeholder="Lý do vì sao đáp án này đúng..." 
          className="h-10 text-sm rounded-xl border-2 border-black/5 bg-white/50" />
      </div>

      <div className="flex gap-2.5 pt-2 border-t border-card-light-border mt-4">
        <Button type="button" size="sm" className="px-6 rounded-xl font-bold shadow-md transition-all active:scale-95 border-none bg-accent-teal text-white"
          disabled={!valid} onClick={() => valid && onSave({ ...draft })}>
          Lưu câu hỏi
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}
          className="rounded-xl px-4 text-content-muted hover:bg-black/5">Hủy bỏ</Button>
      </div>
    </div>
  );
}

// ─── Question Row ─────────────────────────────────────────────────────────────

function QuestionRow({ q, idx, total, onEdit, onDelete, onMove }: {
  q: QuizQuestion; idx: number; total: number;
  onEdit: () => void; onDelete: () => void; onMove: (d: "up" | "down") => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-card-light-border bg-card-light-bg px-5 py-4 group transition-all hover:shadow-md hover:border-accent-blue/30">
      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm bg-[rgba(143,179,200,0.15)] text-accent-blue">
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-relaxed text-content-text">{q.content}</p>
        <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent-teal/10 text-accent-teal border border-accent-teal/10">Đúng</span>
          <p className="text-xs truncate font-medium text-content-muted">
            {LABELS[q.correctAnswer]}. {q.options[q.correctAnswer]}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <div className="flex items-center gap-0.5 bg-black/[0.03] p-0.5 rounded-lg border border-black/5">
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-7 w-7 hover:bg-white/80"
            disabled={idx === 0} onClick={() => onMove("up")} title="Lên">
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-7 w-7 hover:bg-white/80"
            disabled={idx === total - 1} onClick={() => onMove("down")} title="Xuống">
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="w-px h-4 bg-black/10 mx-1" />
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-8 w-8 text-accent-blue hover:bg-accent-blue/10"
          onClick={onEdit} title="Sửa">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-lg h-8 w-8 text-accent-danger hover:bg-accent-danger/10"
          onClick={onDelete} title="Xóa">
          <Trash2 className="h-4 w-4" />
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
  const handleMove = (id: string, dir: "up" | "down") => {
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
        <span className="text-sm font-semibold text-content-heading">
          Câu hỏi ({questions.length})
        </span>
        <div className="flex gap-2 flex-wrap">
          {/* Paste text */}
          <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-lg border-card-light-border bg-transparent text-content-text"
            onClick={() => setPasteOpen(true)}>
            <ClipboardList className="h-3.5 w-3.5" /> Dán văn bản
          </Button>

          {/* File import */}
          <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFile} />
          <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5 rounded-lg border-card-light-border bg-transparent text-content-text"
            onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Import JSON/CSV
          </Button>

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
          <div className="rounded-xl border-2 border-dashed border-card-light-border flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-sm text-content-muted">Chưa có câu hỏi nào</p>
            <div className="flex gap-2 mt-1">
              <Button type="button" size="sm" variant="outline" className="rounded-lg border-card-light-border bg-transparent text-content-text"
                onClick={() => setAddingNew(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Thêm câu hỏi
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

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Lock, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, IconAction, Panel, SectionHeading, formatDate } from "@/components/saas/saas-ui";
import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { CATEGORY_LABEL, LocalReviewBadge, LocalScopeTag, reviewState } from "@/components/saas/local-content-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import {
  LOCAL_SCOPE_LABEL,
  scopeSource,
  useLocalContentMutations,
  useLocalDocumentMutations,
  useLocalDocuments,
  useTeacherLocalContent,
} from "@/features/saas/hooks-local-content";
import { LOCAL_ERA_OPTIONS, LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type {
  LocalCategory,
  LocalCharacterPayload,
  LocalContextPayload,
  LocalDocumentType,
  LocalEra,
  LocalItem,
  LocalKind,
  LocalScope,
} from "@/services/local-content.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Form state ───────────────────────── */

const NONE = "__none__";

interface CtxForm {
  name: string;
  description: string;
  era: LocalEra | typeof NONE;
  category: LocalCategory | typeof NONE;
  startYear: string;
  endYear: string;
  isBC: boolean;
  location: string;
  imageUrl: string;
  videoUrl: string;
}
interface ChrForm {
  name: string;
  title: string;
  background: string;
  personality: string;
  bornYear: string;
  isBornBc: boolean;
  deathYear: string;
  isDeathBc: boolean;
  imageUrl: string;
  modelUrl: string;
  contextId: string;
}
interface FormState {
  scope: LocalScope;
  ctx: CtxForm;
  chr: ChrForm;
}

const str = (n: number | null | undefined) => (n == null ? "" : String(n));
const optStr = (v: string) => v.trim() || undefined;
const optInt = (v: string) => (v.trim() === "" ? undefined : Number(v));
const isUInt = (v: string) => /^\d+$/.test(v.trim());

function initialForm(item: LocalItem | undefined): FormState {
  const ctx: CtxForm = {
    name: "", description: "", era: NONE, category: NONE, startYear: "", endYear: "", isBC: false, location: "", imageUrl: "", videoUrl: "",
  };
  const chr: ChrForm = {
    name: "", title: "", background: "", personality: "", bornYear: "", isBornBc: false, deathYear: "", isDeathBc: false,
    imageUrl: "", modelUrl: "", contextId: NONE,
  };
  if (item?.type === "CONTEXT")
    Object.assign(ctx, {
      name: item.name, description: item.description ?? "", era: item.era ?? NONE, category: item.category ?? NONE,
      startYear: str(item.startYear ?? item.year), endYear: str(item.endYear), isBC: !!item.isBC, location: item.location ?? "",
      imageUrl: item.imageUrl ?? "", videoUrl: item.videoUrl ?? "",
    });
  if (item?.type === "CHARACTER")
    Object.assign(chr, {
      name: item.name, title: item.title ?? "", background: item.description ?? "", personality: item.personality ?? "",
      imageUrl: item.imageUrl ?? "", modelUrl: item.modelUrl ?? "",
    });
  return { scope: item?.contentScope ?? "CLASS_ONLY", ctx, chr };
}

type Errors = Record<string, string>;

/** Mirrors the backend's bean validation so most mistakes never reach the server. */
function validate(kind: LocalKind, f: FormState): Errors {
  const e: Errors = {};
  if (kind === "CONTEXT") {
    const c = f.ctx;
    const n = c.name.trim().length;
    if (n < 3 || n > 100) e.name = "Tên bối cảnh từ 3 đến 100 ký tự";
    const d = c.description.trim().length;
    if (d < 10 || d > 5000) e.description = "Nội dung từ 10 đến 5000 ký tự";
    if ((c.startYear.trim() && !isUInt(c.startYear)) || (c.endYear.trim() && !isUInt(c.endYear))) e.years = "Năm phải là số nguyên dương";
    else if (c.startYear.trim() && c.endYear.trim()) {
      const [s, en] = [Number(c.startYear), Number(c.endYear)];
      if (c.isBC ? en > s : en < s) e.years = "Năm kết thúc phải sau năm bắt đầu";
    }
  } else {
    const c = f.chr;
    const n = c.name.trim().length;
    if (n < 2 || n > 100) e.name = "Tên nhân vật từ 2 đến 100 ký tự";
    if (c.title.trim().length > 150) e.chrTitle = "Danh hiệu tối đa 150 ký tự";
    if (!c.background.trim()) e.background = "Nhập tiểu sử";
    if ((c.bornYear.trim() && !isUInt(c.bornYear)) || (c.deathYear.trim() && !isUInt(c.deathYear))) e.years = "Năm phải là số nguyên dương";
  }
  return e;
}

function contextPayload(f: FormState): LocalContextPayload {
  const c = f.ctx;
  const start = optInt(c.startYear);
  const end = optInt(c.endYear);
  return {
    name: c.name.trim(),
    description: c.description.trim(),
    era: c.era === NONE ? undefined : c.era,
    category: c.category === NONE ? undefined : c.category,
    year: start ?? end,
    startYear: start,
    endYear: end,
    isBC: c.isBC,
    location: optStr(c.location),
    imageUrl: optStr(c.imageUrl),
    videoUrl: optStr(c.videoUrl),
    contentScope: f.scope,
  };
}

function characterPayload(f: FormState, isNew: boolean): LocalCharacterPayload {
  const c = f.chr;
  const born = optInt(c.bornYear);
  const death = optInt(c.deathYear);
  return {
    name: c.name.trim(),
    title: optStr(c.title),
    background: c.background.trim(),
    personality: optStr(c.personality),
    imageUrl: optStr(c.imageUrl),
    modelUrl: optStr(c.modelUrl),
    // The API does not return the years, so blank on edit means "keep what is stored".
    ...(born != null ? { bornYear: born, isBornBc: c.isBornBc } : {}),
    ...(death != null ? { deathYear: death, isDeathBc: c.isDeathBc } : {}),
    ...(isNew && c.contextId !== NONE ? { contextIds: [c.contextId] } : {}),
    contentScope: f.scope,
  };
}

const SCOPE_OPTIONS: { value: LocalScope; title: string; hint: string }[] = [
  {
    value: "CLASS_ONLY",
    title: "Riêng tôi",
    hint: "Chỉ bạn thấy và dùng cho các lớp của mình. Quản trị trường duyệt trước khi học sinh thấy.",
  },
  {
    value: "SCHOOL_WIDE",
    title: "Toàn trường",
    hint: "Mọi giáo viên của trường xem được (chỉ đọc). Quản trị trường duyệt trước khi học sinh thấy.",
  },
];

const STATE_NOTE = {
  PENDING: "Nội dung đang chờ quản trị trường duyệt. Học sinh chưa thấy nội dung này.",
  PUBLISHED: "Nội dung đã được duyệt và hiển thị cho học sinh của trường.",
  HIDDEN: "Quản trị trường đã ẩn nội dung này. Chỉnh sửa rồi liên hệ quản trị trường để duyệt lại.",
} as const;

/* ───────────────────────── Editor ───────────────────────── */

/** Create / edit a local context or character (Sprint 6 API). Everything starts as a draft the School Admin publishes. */
export function LocalApiEditor({ kind, item }: { kind: LocalKind; item?: LocalItem }) {
  const router = useRouter();
  const myUid = useAuthStore((s) => s.user?.uid);
  const mutations = useLocalContentMutations();
  const { contexts } = useTeacherLocalContent(kind === "CHARACTER" && !item);

  const [form, setForm] = React.useState<FormState>(() => initialForm(item));
  const [showErrors, setShowErrors] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const isMine = !item || item.createdBy?.uid === myUid;
  const readOnly = !isMine;
  const errors = showErrors ? validate(kind, form) : {};
  const err = (k: string) => errors[k] ?? null;
  const saving = mutations.createContext.isPending || mutations.updateContext.isPending
    || mutations.createCharacter.isPending || mutations.updateCharacter.isPending;
  const scopeChanged = !!item && form.scope !== item.contentScope;

  const patchCtx = (p: Partial<CtxForm>) => setForm((f) => ({ ...f, ctx: { ...f.ctx, ...p } }));
  const patchChr = (p: Partial<ChrForm>) => setForm((f) => ({ ...f, chr: { ...f.chr, ...p } }));

  const save = async () => {
    setShowErrors(true);
    const first = Object.values(validate(kind, form))[0];
    if (first) {
      toast.error(first);
      return;
    }
    try {
      let saved: LocalItem;
      if (kind === "CONTEXT") {
        saved = item
          ? await mutations.updateContext.mutateAsync({ id: item.id, payload: contextPayload(form) })
          : await mutations.createContext.mutateAsync(contextPayload(form));
      } else {
        saved = item
          ? await mutations.updateCharacter.mutateAsync({ id: item.id, payload: characterPayload(form, false) })
          : await mutations.createCharacter.mutateAsync(characterPayload(form, true));
      }
      if (!item) {
        toast.success("Đã tạo bản nháp", { description: "Quản trị trường sẽ duyệt trước khi học sinh thấy." });
        router.replace(ROUTES.TEACHING.LOCAL_EDIT(saved.id, kind));
      } else {
        toast.success(scopeChanged && item.isPublished ? "Đã lưu — nội dung trở về chờ duyệt vì đổi phạm vi" : "Đã lưu thay đổi");
        setShowErrors(false);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được nội dung. Vui lòng thử lại."));
    }
  };

  const remove = async () => {
    if (!item) return;
    try {
      await mutations.remove.mutateAsync({ kind, id: item.id });
      toast.success(`Đã xóa “${item.name}”`);
      router.push(ROUTES.TEACHING.LOCAL);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không xóa được nội dung. Vui lòng thử lại."));
    }
  };

  const contextOptions = [{ value: NONE, label: "Không liên kết" }, ...contexts.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <div className="space-y-6">
      <Link href={ROUTES.TEACHING.LOCAL} className="archive-link">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tư liệu lớp &amp; trường
      </Link>

      {item && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <LocalScopeTag item={item} />
            <LocalReviewBadge item={item} />
            <span className="text-content-muted">
              {LOCAL_KIND_LABELS[kind]} · Tạo {formatDate(item.createdAt)} · Cập nhật {formatDate(item.updatedAt)}
              {!isMine && ` · Soạn bởi ${item.createdBy?.fullName ?? "đồng nghiệp"}`}
            </span>
          </div>
          <p className="flex items-start gap-2 text-sm text-content-muted">
            {readOnly ? (
              <>
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Nội dung do đồng nghiệp soạn cho toàn trường, bạn chỉ có thể xem.
              </>
            ) : (
              <>
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {STATE_NOTE[reviewState(item)]}
                {item.approvedBy && item.isPublished && ` Duyệt bởi ${item.approvedBy.fullName}.`}
              </>
            )}
          </p>
        </div>
      )}

      <fieldset disabled={readOnly} className="space-y-6">
        <Panel>
          {kind === "CONTEXT" ? (
            <ContextFields f={form.ctx} patch={patchCtx} err={err} />
          ) : (
            <CharacterFields f={form.chr} patch={patchChr} err={err} isNew={!item} contextOptions={contextOptions} />
          )}
        </Panel>

        <Panel>
          <div className="space-y-2">
            <p id="scope-label" className="text-sm font-semibold text-content-heading">
              Phạm vi chia sẻ
            </p>
            <div role="radiogroup" aria-labelledby="scope-label" className="grid gap-2 sm:grid-cols-2">
              {SCOPE_OPTIONS.map((o) => {
                const active = form.scope === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={readOnly}
                    onClick={() => setForm((f) => ({ ...f, scope: o.value }))}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-[2px] border p-3 text-left transition-colors disabled:cursor-not-allowed",
                      active
                        ? "border-[var(--text-primary)] bg-[var(--status-neutral-bg)]"
                        : "border-[var(--border-strong)] hover:border-[var(--text-primary)] disabled:opacity-60",
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="font-semibold text-content-heading">{o.title}</span>
                      <ContentSourceTag source={scopeSource(o.value)} label={LOCAL_SCOPE_LABEL[o.value]} />
                    </span>
                    <span className="text-xs leading-relaxed text-content-muted">{o.hint}</span>
                  </button>
                );
              })}
            </div>
            {scopeChanged && item?.isPublished && (
              <p className="text-xs text-[var(--status-warning)]">Đổi phạm vi sẽ gỡ xuất bản; quản trị trường cần duyệt lại.</p>
            )}
          </div>
        </Panel>
      </fieldset>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--text-primary)] pt-4">
          <div>
            {item && (
              <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa
              </button>
            )}
          </div>
          <button type="button" className="btn-crimson disabled:opacity-60" onClick={save} disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Đang lưu..." : item ? "Lưu thay đổi" : "Tạo bản nháp"}
          </button>
        </div>
      )}

      {item && <DocumentsPanel kind={kind} itemId={item.id} canEdit={isMine} myUid={myUid} />}

      {item && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          variant="danger"
          title={`Xóa ${LOCAL_KIND_LABELS[kind].toLowerCase()}?`}
          description={`“${item.name}” sẽ bị gỡ khỏi danh sách và học sinh không còn thấy.`}
          confirmLabel="Xóa"
          onConfirm={remove}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Field groups ───────────────────────── */

type ErrFn = (k: string) => string | null;

const ERA_OPTIONS = [{ value: NONE, label: "Chưa chọn" }, ...LOCAL_ERA_OPTIONS] as { value: LocalEra | typeof NONE; label: string }[];
const CATEGORY_OPTIONS = [
  { value: NONE, label: "Chưa chọn" },
  ...(Object.keys(CATEGORY_LABEL) as LocalCategory[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
] as { value: LocalCategory | typeof NONE; label: string }[];

function BcCheckbox({ id, checked, onChange, label = "Trước Công nguyên" }: { id: string; checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-content-text">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      {label}
    </label>
  );
}

function ContextFields({ f, patch, err }: { f: CtxForm; patch: (p: Partial<CtxForm>) => void; err: ErrFn }) {
  return (
    <div className="space-y-4">
      <Field label="Tên bối cảnh" required error={err("name")}>
        <StaffFormInput value={f.name} onChange={(e) => patch({ name: e.target.value })} maxLength={100} placeholder="VD: Khởi nghĩa Hai Bà Trưng tại Mê Linh" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Thời kỳ">
          <StaffFormSelect value={f.era} onValueChange={(era) => patch({ era })} options={ERA_OPTIONS} className="w-full" />
        </Field>
        <Field label="Chủ đề">
          <StaffFormSelect value={f.category} onValueChange={(category) => patch({ category })} options={CATEGORY_OPTIONS} className="w-full" />
        </Field>
      </div>
      <Field label="Năm diễn ra" error={err("years")} hint="Để trống năm kết thúc nếu sự kiện chỉ trong một năm.">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
          <StaffFormInput type="number" min={0} aria-label="Năm bắt đầu" value={f.startYear} onChange={(e) => patch({ startYear: e.target.value })} placeholder="Năm bắt đầu, VD 40" />
          <StaffFormInput type="number" min={0} aria-label="Năm kết thúc" value={f.endYear} onChange={(e) => patch({ endYear: e.target.value })} placeholder="Năm kết thúc, VD 43" />
          <BcCheckbox id="ctx-bc" checked={f.isBC} onChange={(isBC) => patch({ isBC })} label="TCN" />
        </div>
      </Field>
      <Field label="Địa điểm">
        <StaffFormInput value={f.location} onChange={(e) => patch({ location: e.target.value })} maxLength={255} placeholder="Mê Linh, Vĩnh Phúc" />
      </Field>
      <Field label="Nội dung" required error={err("description")} hint={`${f.description.trim().length}/5000 ký tự`}>
        <StaffFormTextarea value={f.description} onChange={(e) => patch({ description: e.target.value })} maxLength={5000} className="min-h-[220px] resize-y" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ảnh minh họa (URL)">
          <StaffFormInput type="url" value={f.imageUrl} onChange={(e) => patch({ imageUrl: e.target.value })} maxLength={500} placeholder="https://..." />
        </Field>
        <Field label="Video (URL)">
          <StaffFormInput type="url" value={f.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} maxLength={500} placeholder="https://..." />
        </Field>
      </div>
    </div>
  );
}

function CharacterFields({
  f,
  patch,
  err,
  isNew,
  contextOptions,
}: {
  f: ChrForm;
  patch: (p: Partial<ChrForm>) => void;
  err: ErrFn;
  isNew: boolean;
  contextOptions: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên nhân vật" required error={err("name")}>
          <StaffFormInput value={f.name} onChange={(e) => patch({ name: e.target.value })} maxLength={100} placeholder="VD: Bà Trưng Trắc" />
        </Field>
        <Field label="Danh hiệu / vai trò" error={err("chrTitle")}>
          <StaffFormInput value={f.title} onChange={(e) => patch({ title: e.target.value })} maxLength={150} placeholder="Trưng Nữ Vương" />
        </Field>
      </div>
      <Field
        label="Năm sinh – năm mất"
        error={err("years")}
        hint={isNew ? "Để trống nếu không rõ." : "Hệ thống chưa trả lại năm sinh/mất đã lưu: để trống để giữ nguyên, nhập để thay."}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <StaffFormInput type="number" min={0} aria-label="Năm sinh" value={f.bornYear} onChange={(e) => patch({ bornYear: e.target.value })} placeholder="Năm sinh" />
            <BcCheckbox id="chr-born-bc" checked={f.isBornBc} onChange={(isBornBc) => patch({ isBornBc })} label="TCN" />
          </div>
          <div className="flex items-center gap-3">
            <StaffFormInput type="number" min={0} aria-label="Năm mất" value={f.deathYear} onChange={(e) => patch({ deathYear: e.target.value })} placeholder="Năm mất" />
            <BcCheckbox id="chr-death-bc" checked={f.isDeathBc} onChange={(isDeathBc) => patch({ isDeathBc })} label="TCN" />
          </div>
        </div>
      </Field>
      <Field label="Tiểu sử" required error={err("background")}>
        <StaffFormTextarea value={f.background} onChange={(e) => patch({ background: e.target.value })} className="min-h-[140px] resize-y" />
      </Field>
      <Field label="Tính cách / giọng nói khi trò chuyện với AI" hint="AI dùng mô tả này để nhập vai nhân vật khi học sinh trò chuyện.">
        <StaffFormTextarea
          value={f.personality}
          onChange={(e) => patch({ personality: e.target.value })}
          className="min-h-[100px]"
          placeholder="VD: Dũng cảm, quyết đoán; xưng 'ta' với học trò."
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ảnh chân dung (URL)">
          <StaffFormInput type="url" value={f.imageUrl} onChange={(e) => patch({ imageUrl: e.target.value })} maxLength={500} placeholder="https://..." />
        </Field>
        <Field label="Mô hình 3D (URL)">
          <StaffFormInput type="url" value={f.modelUrl} onChange={(e) => patch({ modelUrl: e.target.value })} maxLength={500} placeholder="https://..." />
        </Field>
      </div>
      {isNew && (
        <Field label="Bối cảnh địa phương liên quan" hint="Chỉ chọn được khi tạo mới.">
          <StaffFormSelect value={f.contextId} onValueChange={(contextId) => patch({ contextId })} options={contextOptions} className="w-full" />
        </Field>
      )}
    </div>
  );
}

/* ───────────────────────── Documents (RAG) ───────────────────────── */

const DOC_TYPE_OPTIONS: { value: LocalDocumentType; label: string }[] = [
  { value: "TEXT", label: "Văn bản" },
  { value: "URL", label: "Liên kết" },
];

function DocumentsPanel({ kind, itemId, canEdit, myUid }: { kind: LocalKind; itemId: string; canEdit: boolean; myUid?: string }) {
  const docs = useLocalDocuments(kind, itemId);
  const { add, remove } = useLocalDocumentMutations(kind, itemId);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [fileUrl, setFileUrl] = React.useState("");
  const [type, setType] = React.useState<LocalDocumentType>("TEXT");
  const [showErrors, setShowErrors] = React.useState(false);
  const [deleting, setDeleting] = React.useState<{ id: string; title: string } | null>(null);

  const titleErr = showErrors && (title.trim().length < 3 || title.trim().length > 255) ? "Tiêu đề từ 3 đến 255 ký tự" : null;
  const contentErr = showErrors && content.trim().length < 10 ? "Nội dung ít nhất 10 ký tự" : null;

  const submit = async () => {
    setShowErrors(true);
    if (title.trim().length < 3 || title.trim().length > 255 || content.trim().length < 10) return;
    try {
      await add.mutateAsync({ title: title.trim(), content: content.trim(), fileUrl: fileUrl.trim() || undefined, type });
      toast.success("Đã thêm tài liệu", { description: "AI sẽ dùng tài liệu này khi trả lời về nội dung." });
      setTitle("");
      setContent("");
      setFileUrl("");
      setType("TEXT");
      setShowErrors(false);
      setOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không thêm được tài liệu. Vui lòng thử lại."));
    }
  };

  const list = docs.data ?? [];

  return (
    <section className="space-y-4">
      <SectionHeading
        title={`Tài liệu cho AI (${list.length})`}
        description="Tư liệu tham khảo giúp AI trả lời chính xác hơn khi học sinh hỏi về nội dung này."
        actions={
          canEdit && !open && (
            <button type="button" className="btn-ink" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Thêm tài liệu
            </button>
          )
        }
      />

      {open && (
        <Panel className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
            <Field label="Tiêu đề" required error={titleErr}>
              <StaffFormInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
            </Field>
            <Field label="Loại">
              <StaffFormSelect value={type} onValueChange={setType} options={DOC_TYPE_OPTIONS} className="w-full" />
            </Field>
          </div>
          <Field label="Nội dung" required error={contentErr} hint="Dán toàn văn tài liệu; AI đọc phần nội dung này.">
            <StaffFormTextarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[160px] resize-y" />
          </Field>
          <Field label="Đường dẫn nguồn (URL)">
            <StaffFormInput type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} maxLength={500} placeholder="https://..." />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-line" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button type="button" className="btn-crimson disabled:opacity-60" onClick={submit} disabled={add.isPending}>
              {add.isPending ? "Đang thêm..." : "Thêm tài liệu"}
            </button>
          </div>
        </Panel>
      )}

      {docs.isLoading ? (
        <p className="text-sm text-content-muted">Đang tải tài liệu...</p>
      ) : docs.isError ? (
        <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(docs.error, "Không tải được tài liệu.")}</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-content-muted">Chưa có tài liệu nào.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {list.map((d) => (
            <li key={d.docId} className="flex items-start gap-3 py-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-content-heading">{d.title}</p>
                <p className="line-clamp-2 text-xs text-content-muted">{d.content}</p>
                <p className="mt-1 text-[11px] text-content-muted">
                  {d.userName ?? "—"} · {formatDate(d.uploadDate)}
                  {d.fileUrl && (
                    <>
                      {" · "}
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="archive-link">
                        Nguồn
                      </a>
                    </>
                  )}
                </p>
              </div>
              {d.uid === myUid && (
                <IconAction label={`Xóa tài liệu ${d.title}`} tone="danger" onClick={() => setDeleting({ id: d.docId, title: d.title })}>
                  <Trash2 className="h-4 w-4" />
                </IconAction>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        variant="danger"
        title="Xóa tài liệu?"
        description={`“${deleting?.title ?? ""}” sẽ không còn được AI sử dụng.`}
        confirmLabel="Xóa"
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success("Đã xóa tài liệu");
          } catch (error) {
            toast.error(apiErrorMessage(error, "Không xóa được tài liệu."));
          }
          setDeleting(null);
        }}
      />
    </section>
  );
}

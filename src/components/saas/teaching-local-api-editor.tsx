"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, EyeOff, FileText, Lock, Plus, Save, Send, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, IconAction, Panel, SectionHeading, formatDate } from "@/components/saas/saas-ui";
import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { LocalReviewBadge, LocalScopeTag, ReviewNote, reviewState } from "@/components/saas/local-content-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";
import {
  LOCAL_SCOPE_LABEL,
  scopeSource,
  useLocalContentMutations,
  useLocalDocumentMutations,
  useLocalDocuments,
  useTeacherLocalContent,
} from "@/features/saas/hooks-local-content";
import { LOCAL_ERA_OPTIONS, LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import { validateCharacterDraft, validateContextDraft } from "@/lib/utils/content-validation";
import { isValidUrl } from "@/lib/utils/url";
import { getYouTubeEmbedUrl } from "@/lib/utils/video-url";
import type {
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

/*
 * Teacher-authored contexts / characters (Sprint 6 API). Same content as the Content Admin's contexts and
 * characters — only the author differs — so the form follows the staff form: same tabs, fields and validation.
 * Media are URLs because the upload endpoints are Content Admin only.
 */

/* ───────────────────────── Form state ───────────────────────── */

const NONE = "__none__";

interface CtxForm {
  name: string;
  era: LocalEra | "";
  year: string;
  isBC: boolean;
  location: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  latitude: string;
  longitude: string;
}
interface ChrForm {
  name: string;
  title: string;
  bornDay: string;
  bornMonth: string;
  bornYear: string;
  isBornBc: boolean;
  deathDay: string;
  deathMonth: string;
  deathYear: string;
  isDeathBc: boolean;
  background: string;
  personality: string;
  imageUrl: string;
  modelUrl: string;
  contextId: string;
}
interface FormState {
  scope: LocalScope;
  /** Classrooms the item is assigned to. */
  classIds: string[];
  ctx: CtxForm;
  chr: ChrForm;
}

const str = (n: number | null | undefined) => (n == null ? "" : String(n));
const optStr = (v: string) => v.trim() || undefined;
const optInt = (v: string) => (v.trim() === "" ? undefined : Number(v));
const optFloat = (v: string) => (v.trim() === "" ? undefined : Number(v));
const isCoord = (v: string, max: number) => v.trim() === "" || (Number.isFinite(Number(v)) && Math.abs(Number(v)) <= max);

function initialForm(item: LocalItem | undefined): FormState {
  const ctx: CtxForm = {
    name: "", era: "", year: "", isBC: false, location: "", description: "", imageUrl: "", videoUrl: "", latitude: "", longitude: "",
  };
  const chr: ChrForm = {
    name: "", title: "", bornDay: "", bornMonth: "", bornYear: "", isBornBc: false, deathDay: "", deathMonth: "", deathYear: "",
    isDeathBc: false, background: "", personality: "", imageUrl: "", modelUrl: "", contextId: NONE,
  };
  if (item?.type === "CONTEXT")
    Object.assign(ctx, {
      name: item.name, era: item.era ?? "", year: str(item.year ?? item.startYear ?? item.endYear), isBC: !!item.isBC,
      location: item.location ?? "", description: item.description ?? "", imageUrl: item.imageUrl ?? "", videoUrl: item.videoUrl ?? "",
      latitude: str(item.latitude), longitude: str(item.longitude),
    });
  if (item?.type === "CHARACTER")
    Object.assign(chr, {
      name: item.name, title: item.title ?? "",
      bornDay: str(item.bornDay), bornMonth: str(item.bornMonth), bornYear: str(item.bornYear), isBornBc: !!item.isBornBc,
      deathDay: str(item.deathDay), deathMonth: str(item.deathMonth), deathYear: str(item.deathYear), isDeathBc: !!item.isDeathBc,
      background: item.description ?? "", personality: item.personality ?? "",
      imageUrl: item.imageUrl ?? "", modelUrl: item.modelUrl ?? "", contextId: item.contextIds?.[0] ?? NONE,
    });
  return { scope: item?.contentScope ?? "CLASS_ONLY", classIds: item?.classIds ?? [], ctx, chr };
}

type Errors = Record<string, string | undefined>;

/** Content Admin's validation, plus the length limits of the teacher API. */
function validate(kind: LocalKind, f: FormState): Errors {
  if (kind === "CONTEXT") {
    const c = f.ctx;
    const e: Errors = { ...validateContextDraft(c) };
    const n = c.name.trim().length;
    if (!e.name && (n < 3 || n > 100)) e.name = "Tên bối cảnh từ 3 đến 100 ký tự.";
    const d = c.description.trim().length;
    if (!e.description && (d < 10 || d > 5000)) e.description = "Mô tả từ 10 đến 5000 ký tự.";
    if (!isCoord(c.latitude, 90) || !isCoord(c.longitude, 180)) e.coords = "Vĩ độ từ -90 đến 90, kinh độ từ -180 đến 180.";
    else if (!c.latitude.trim() !== !c.longitude.trim()) e.coords = "Nhập cả vĩ độ và kinh độ.";
    return e;
  }
  const c = f.chr;
  const e: Errors = { ...validateCharacterDraft({ ...c, image: c.imageUrl }) };
  const n = c.name.trim().length;
  if (!e.name && (n < 2 || n > 100)) e.name = "Tên nhân vật từ 2 đến 100 ký tự.";
  if (!e.title && c.title.trim().length > 150) e.title = "Chức vị tối đa 150 ký tự.";
  return e;
}

/** Which tab holds each field, so the tab with an error gets a dot. */
const FIELD_TAB: Record<string, Tab> = {
  name: "basic", era: "basic", year: "basic", location: "basic", description: "basic", coords: "basic",
  title: "basic", bornDay: "basic", bornMonth: "basic", bornYear: "basic", deathDay: "basic", deathMonth: "basic", deathYear: "basic",
  imageUrl: "media", videoUrl: "media", image: "media", modelUrl: "media",
  background: "content", personality: "content",
};

function contextPayload(f: FormState, isPublished?: boolean): LocalContextPayload {
  const c = f.ctx;
  const year = optInt(c.year);
  return {
    name: c.name.trim(),
    description: c.description.trim(),
    era: c.era || undefined,
    year,
    startYear: year,
    endYear: year,
    isBC: c.isBC,
    location: optStr(c.location),
    imageUrl: optStr(c.imageUrl),
    videoUrl: optStr(c.videoUrl),
    latitude: optFloat(c.latitude),
    longitude: optFloat(c.longitude),
    contentScope: f.scope,
    classIds: f.classIds,
    isPublished,
  };
}

function characterPayload(f: FormState, item?: LocalItem, isPublished?: boolean): LocalCharacterPayload {
  const c = f.chr;
  const linked = c.contextId === NONE ? [] : [c.contextId];
  // Only send links when the choice changed, so extra links stored by the API are kept.
  const linksChanged = !item || (item.contextIds?.[0] ?? NONE) !== c.contextId;
  const born = optInt(c.bornYear);
  const death = optInt(c.deathYear);
  return {
    name: c.name.trim(),
    title: optStr(c.title),
    background: c.background.trim(),
    personality: optStr(c.personality),
    imageUrl: optStr(c.imageUrl),
    modelUrl: optStr(c.modelUrl),
    // The API skips null fields, so a blank date on edit keeps what is stored.
    ...(born != null ? { bornYear: born, bornMonth: optInt(c.bornMonth), bornDay: optInt(c.bornDay), isBornBc: c.isBornBc } : {}),
    ...(death != null ? { deathYear: death, deathMonth: optInt(c.deathMonth), deathDay: optInt(c.deathDay), isDeathBc: c.isDeathBc } : {}),
    ...(linksChanged && (item || linked.length) ? { contextIds: linked } : {}),
    contentScope: f.scope,
    classIds: f.classIds,
    isPublished,
  };
}

const SCOPE_OPTIONS: { value: LocalScope; title: string; hint: string }[] = [
  {
    value: "CLASS_ONLY",
    title: "Riêng tôi",
    hint: "Chỉ bạn thấy và dùng cho các lớp của mình.",
  },
  {
    value: "SCHOOL_WIDE",
    title: "Toàn trường",
    hint: "Lưu vào kho tư liệu của trường: mọi giáo viên của trường xem và dùng được (chỉ đọc).",
  },
];

const STATE_NOTE = {
  DRAFT: "Bản nháp: học sinh chưa thấy. Soạn xong, bấm “Xuất bản” để học sinh thấy ngay.",
  PUBLISHED: "Đã xuất bản: học sinh của trường đang thấy nội dung này. Thay đổi bạn lưu được cập nhật ngay.",
  HIDDEN: "Nội dung đang bị ẩn với học sinh. Chỉnh sửa nếu cần rồi xuất bản lại.",
} as const;

type Tab = "basic" | "media" | "content" | "sharing" | "rag" | "context";

const TAB_LABEL: Record<Tab, string> = {
  basic: "Cơ bản",
  media: "Media",
  content: "Nội dung",
  sharing: "Chia sẻ & lớp",
  rag: "Tài liệu",
  context: "Liên kết bối cảnh",
};

/* ───────────────────────── Editor ───────────────────────── */

/** Create / edit a context or character. The teacher publishes it themself; the School Admin only oversees (may hide it). */
export function LocalApiEditor({ kind, item }: { kind: LocalKind; item?: LocalItem }) {
  const router = useRouter();
  const myUid = useAuthStore((s) => s.user?.uid);
  const mutations = useLocalContentMutations();
  const { contexts } = useTeacherLocalContent(kind === "CHARACTER");
  const { classes } = useMyApiClassrooms("TEACHER");

  const [form, setForm] = React.useState<FormState>(() => initialForm(item));
  const [showErrors, setShowErrors] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("basic");

  const isMine = !item || item.createdBy?.uid === myUid;
  const readOnly = !isMine;
  const errors = showErrors ? validate(kind, form) : {};
  const err = (k: string) => errors[k] ?? null;
  const tabHasError = (t: Tab) => Object.entries(errors).some(([k, v]) => v && FIELD_TAB[k] === t);
  const saving = mutations.createContext.isPending || mutations.updateContext.isPending
    || mutations.createCharacter.isPending || mutations.updateCharacter.isPending;
  const state = item ? reviewState(item) : null;
  const published = state === "PUBLISHED";
  const busy = saving || mutations.setStatus.isPending;

  const tabs: Tab[] = kind === "CONTEXT"
    ? ["basic", "media", "sharing", ...(item ? (["rag"] as Tab[]) : [])]
    : ["basic", "media", "content", "context", "sharing", ...(item ? (["rag"] as Tab[]) : [])];

  const patchCtx = (p: Partial<CtxForm>) => setForm((f) => ({ ...f, ctx: { ...f.ctx, ...p } }));
  const patchChr = (p: Partial<ChrForm>) => setForm((f) => ({ ...f, chr: { ...f.chr, ...p } }));

  /** `publish`: create → published or draft; edit → true publishes, undefined keeps the current status. */
  const save = async (publish?: boolean) => {
    setShowErrors(true);
    const found = Object.entries(validate(kind, form)).find(([, v]) => v);
    if (found) {
      setTab(FIELD_TAB[found[0]] ?? "basic");
      toast.error(found[1]);
      return;
    }
    try {
      let saved: LocalItem;
      if (kind === "CONTEXT") {
        saved = item
          ? await mutations.updateContext.mutateAsync({ id: item.id, payload: contextPayload(form, publish) })
          : await mutations.createContext.mutateAsync(contextPayload(form, !!publish));
      } else {
        saved = item
          ? await mutations.updateCharacter.mutateAsync({ id: item.id, payload: characterPayload(form, item, publish) })
          : await mutations.createCharacter.mutateAsync(characterPayload(form, undefined, !!publish));
      }
      if (publish) toast.success(`Đã xuất bản “${saved.name}”`, { description: "Học sinh của trường đã thấy nội dung này." });
      else if (item) toast.success("Đã lưu thay đổi");
      else toast.success("Đã lưu bản nháp", { description: "Bấm “Xuất bản” khi soạn xong để học sinh thấy." });
      if (!item) router.replace(ROUTES.TEACHING.LOCAL_EDIT(saved.id, kind));
      else setShowErrors(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không lưu được nội dung. Vui lòng thử lại."));
    }
  };

  const hide = async () => {
    if (!item) return;
    try {
      await mutations.setStatus.mutateAsync({ kind, id: item.id, payload: { status: "INACTIVE" } });
      toast.success(`Đã ẩn “${item.name}” với học sinh`);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không ẩn được nội dung. Vui lòng thử lại."));
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
  const toggleClass = (id: string, on: boolean) =>
    setForm((f) => ({ ...f, classIds: on ? [...f.classIds, id] : f.classIds.filter((c) => c !== id) }));

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
                {item.approvedBy && item.isPublished && item.approvedBy.uid !== myUid && ` Xuất bản bởi ${item.approvedBy.fullName}.`}
              </>
            )}
          </p>
          {isMine && <ReviewNote item={item} />}
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="gap-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t} className="relative px-3">
              {TAB_LABEL[t]}
              {tabHasError(t) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--accent-danger)]" aria-label="Có lỗi" />}
            </TabsTrigger>
          ))}
        </TabsList>

        <fieldset disabled={readOnly} className="min-w-0">
          <TabsContent value="basic" className="mt-0">
            <Panel>
              {kind === "CONTEXT" ? <ContextBasic f={form.ctx} patch={patchCtx} err={err} /> : <CharacterBasic f={form.chr} patch={patchChr} err={err} />}
            </Panel>
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            <Panel>
              {kind === "CONTEXT" ? (
                <MediaFields
                  err={err}
                  image={{ value: form.ctx.imageUrl, onChange: (imageUrl) => patchCtx({ imageUrl }), errKey: "imageUrl", label: "Ảnh bối cảnh (URL)" }}
                  video={{ value: form.ctx.videoUrl, onChange: (videoUrl) => patchCtx({ videoUrl }), errKey: "videoUrl", label: "Video bối cảnh (URL)" }}
                />
              ) : (
                <MediaFields
                  err={err}
                  image={{ value: form.chr.imageUrl, onChange: (imageUrl) => patchChr({ imageUrl }), errKey: "image", label: "Ảnh nhân vật (URL)" }}
                  model={{ value: form.chr.modelUrl, onChange: (modelUrl) => patchChr({ modelUrl }), errKey: "modelUrl", label: "Mô hình 3D (URL)" }}
                />
              )}
            </Panel>
          </TabsContent>

          {kind === "CHARACTER" && (
            <>
              <TabsContent value="content" className="mt-0">
                <Panel>
                  <CharacterContent f={form.chr} patch={patchChr} err={err} />
                </Panel>
              </TabsContent>
              <TabsContent value="context" className="mt-0">
                <Panel>
                  <Field label="Bối cảnh liên kết" hint="Bối cảnh bạn soạn hoặc bối cảnh toàn trường của đồng nghiệp.">
                    <StaffFormSelect value={form.chr.contextId} onValueChange={(contextId) => patchChr({ contextId })} options={contextOptions} className="w-full" />
                  </Field>
                </Panel>
              </TabsContent>
            </>
          )}

          <TabsContent value="sharing" className="mt-0 space-y-4">
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
              </div>
            </Panel>

            <Panel>
              <div className="space-y-2">
                <p id="classes-label" className="text-sm font-semibold text-content-heading">
                  Gán cho lớp
                </p>
                <p className="text-xs text-content-muted">
                  Học sinh của lớp được chọn sẽ thấy nội dung trong trang lớp sau khi xuất bản. Không chọn lớp nào thì nội dung hiển thị ở mọi lớp.
                  {form.classIds.length > 0 && " Hệ thống chưa hỗ trợ bỏ chọn hết lớp sau khi đã gán."}
                </p>
                {classes.length === 0 ? (
                  <p className="text-sm text-content-muted">Bạn chưa phụ trách lớp nào.</p>
                ) : (
                  <div role="group" aria-labelledby="classes-label" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {classes.map((c) => (
                      <label
                        key={c.id}
                        htmlFor={`cls-${c.id}`}
                        className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-[var(--border-strong)] p-2.5 text-sm hover:border-[var(--text-primary)]"
                      >
                        <Checkbox id={`cls-${c.id}`} checked={form.classIds.includes(c.id)} onCheckedChange={(v) => toggleClass(c.id, !!v)} />
                        <span className="min-w-0 flex-1 truncate font-medium text-content-heading">{c.className}</span>
                        <span className="text-xs text-content-muted">{c.classCode}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          </TabsContent>
        </fieldset>

        {item && (
          <TabsContent value="rag" className="mt-0">
            <DocumentsPanel kind={kind} itemId={item.id} canEdit={isMine} myUid={myUid} />
          </TabsContent>
        )}
      </Tabs>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--text-primary)] pt-4">
          <div>
            {item && (
              <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {published ? (
              <>
                <button type="button" className="btn-line disabled:opacity-60" onClick={hide} disabled={busy}>
                  <EyeOff className="h-4 w-4" aria-hidden="true" /> {mutations.setStatus.isPending ? "Đang ẩn..." : "Ẩn với học sinh"}
                </button>
                <button type="button" className="btn-crimson disabled:opacity-60" onClick={() => save()} disabled={busy}>
                  <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-line disabled:opacity-60" onClick={() => save(item ? undefined : false)} disabled={busy}>
                  <Save className="h-4 w-4" aria-hidden="true" /> {item ? "Lưu thay đổi" : "Lưu nháp"}
                </button>
                <button type="button" className="btn-crimson disabled:opacity-60" onClick={() => save(true)} disabled={busy}>
                  <Send className="h-4 w-4" aria-hidden="true" /> {saving ? "Đang lưu..." : state === "HIDDEN" ? "Lưu & xuất bản lại" : "Xuất bản"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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

/* ───────────────────────── Field groups (mirroring the Content Admin form) ───────────────────────── */

type ErrFn = (k: string) => string | null;

const ERA_OPTIONS = [{ value: NONE, label: "Chọn thời đại" }, ...LOCAL_ERA_OPTIONS] as { value: LocalEra | typeof NONE; label: string }[];

function BcCheckbox({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-sm text-content-text">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      TCN
    </label>
  );
}

function ContextBasic({ f, patch, err }: { f: CtxForm; patch: (p: Partial<CtxForm>) => void; err: ErrFn }) {
  return (
    <div className="space-y-4">
      <Field label="Tên bối cảnh" required error={err("name")}>
        <StaffFormInput value={f.name} onChange={(e) => patch({ name: e.target.value })} maxLength={100} placeholder="VD: Trận Bạch Đằng" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Thời đại" required error={err("era")}>
          <StaffFormSelect
            value={f.era || NONE}
            onValueChange={(v) => patch({ era: v === NONE ? "" : v })}
            options={ERA_OPTIONS}
            className="w-full"
          />
        </Field>
        <Field label="Năm" required error={err("year")}>
          <div className="flex items-center gap-3">
            <StaffFormInput type="number" min={0} value={f.year} onChange={(e) => patch({ year: e.target.value })} placeholder="938" />
            <BcCheckbox id="ctx-bc" checked={f.isBC} onChange={(isBC) => patch({ isBC })} />
          </div>
        </Field>
      </div>
      <Field label="Mô tả" required error={err("description")} hint={`${f.description.trim().length}/5000 ký tự`}>
        <StaffFormTextarea
          value={f.description}
          onChange={(e) => patch({ description: e.target.value })}
          maxLength={5000}
          className="min-h-[200px] resize-y"
          placeholder="Bối cảnh lịch sử..."
        />
      </Field>
      <Field label="Địa điểm" required error={err("location")}>
        <StaffFormInput value={f.location} onChange={(e) => patch({ location: e.target.value })} maxLength={255} placeholder="VD: Sông Bạch Đằng, Quảng Ninh" />
      </Field>
      <Field label="Tọa độ trên bản đồ" error={err("coords")} hint="Không bắt buộc. Lấy từ Google Maps: nhấp chuột phải vào vị trí để sao chép.">
        <div className="grid gap-3 sm:grid-cols-2">
          <StaffFormInput type="number" step="any" aria-label="Vĩ độ" value={f.latitude} onChange={(e) => patch({ latitude: e.target.value })} placeholder="Vĩ độ, VD 20.9" />
          <StaffFormInput type="number" step="any" aria-label="Kinh độ" value={f.longitude} onChange={(e) => patch({ longitude: e.target.value })} placeholder="Kinh độ, VD 106.8" />
        </div>
      </Field>
    </div>
  );
}

function DateParts({
  label,
  prefix,
  day,
  month,
  year,
  bc,
  onChange,
  err,
}: {
  label: string;
  prefix: "born" | "death";
  day: string;
  month: string;
  year: string;
  bc: boolean;
  onChange: (p: Partial<ChrForm>) => void;
  err: ErrFn;
}) {
  const k = (part: "Day" | "Month" | "Year" | "Bc") => (part === "Bc" ? (prefix === "born" ? "isBornBc" : "isDeathBc") : `${prefix}${part}`);
  const error = err(`${prefix}Day`) ?? err(`${prefix}Month`) ?? err(`${prefix}Year`);
  return (
    <Field label={label} error={error}>
      <div className="grid grid-cols-[1fr_1fr_1.4fr_auto] items-center gap-2">
        <StaffFormInput type="number" min={1} max={31} aria-label={`${label} - ngày`} value={day} onChange={(e) => onChange({ [k("Day")]: e.target.value })} placeholder="Ngày" />
        <StaffFormInput type="number" min={1} max={12} aria-label={`${label} - tháng`} value={month} onChange={(e) => onChange({ [k("Month")]: e.target.value })} placeholder="Tháng" />
        <StaffFormInput type="number" min={0} aria-label={`${label} - năm`} value={year} onChange={(e) => onChange({ [k("Year")]: e.target.value })} placeholder="Năm" />
        <BcCheckbox id={`chr-${prefix}-bc`} checked={bc} onChange={(v) => onChange({ [k("Bc")]: v })} />
      </div>
    </Field>
  );
}

function CharacterBasic({ f, patch, err }: { f: ChrForm; patch: (p: Partial<ChrForm>) => void; err: ErrFn }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên nhân vật" required error={err("name")}>
          <StaffFormInput value={f.name} onChange={(e) => patch({ name: e.target.value })} maxLength={100} placeholder="VD: Ngô Quyền" />
        </Field>
        <Field label="Chức vị" required error={err("title")}>
          <StaffFormInput value={f.title} onChange={(e) => patch({ title: e.target.value })} maxLength={150} placeholder="VD: Tiết độ sứ" />
        </Field>
      </div>
      <DateParts label="Ngày sinh" prefix="born" day={f.bornDay} month={f.bornMonth} year={f.bornYear} bc={f.isBornBc} onChange={patch} err={err} />
      <DateParts label="Ngày mất" prefix="death" day={f.deathDay} month={f.deathMonth} year={f.deathYear} bc={f.isDeathBc} onChange={patch} err={err} />
    </div>
  );
}

function CharacterContent({ f, patch, err }: { f: ChrForm; patch: (p: Partial<ChrForm>) => void; err: ErrFn }) {
  return (
    <div className="space-y-4">
      <Field label="Tiểu sử / Bối cảnh" required error={err("background")}>
        <StaffFormTextarea
          value={f.background}
          onChange={(e) => patch({ background: e.target.value })}
          className="min-h-[180px] resize-y"
          placeholder="Mô tả cuộc đời, vai trò lịch sử..."
        />
      </Field>
      <Field label="Tính cách" required error={err("personality")} hint="AI dùng mô tả này để nhập vai nhân vật khi học sinh trò chuyện.">
        <StaffFormTextarea
          value={f.personality}
          onChange={(e) => patch({ personality: e.target.value })}
          className="min-h-[120px] resize-y"
          placeholder="Đặc điểm tính cách, phong cách nói chuyện..."
        />
      </Field>
    </div>
  );
}

type UrlSlot = { value: string; onChange: (v: string) => void; errKey: string; label: string };

/** URL inputs with a live preview, in place of the staff upload slots. */
function MediaFields({ image, video, model, err }: { image: UrlSlot; video?: UrlSlot; model?: UrlSlot; err: ErrFn }) {
  const embed = video ? getYouTubeEmbedUrl(video.value) : null;
  return (
    <div className="space-y-5">
      <Field label={image.label} error={err(image.errKey)} hint="Dán đường dẫn ảnh (JPEG, PNG, WEBP...).">
        <StaffFormInput type="url" value={image.value} onChange={(e) => image.onChange(e.target.value)} maxLength={500} placeholder="https://..." />
      </Field>
      {isValidUrl(image.value.trim()) && (
        // eslint-disable-next-line @next/next/no-img-element -- teacher-provided URL of any host
        <img src={image.value.trim()} alt="Xem trước ảnh" className="max-h-56 rounded-[2px] border border-[var(--border-default)] object-cover" />
      )}
      {video && (
        <>
          <Field label={video.label} error={err(video.errKey)} hint="YouTube hoặc đường dẫn video trực tiếp (MP4, WEBM).">
            <StaffFormInput type="url" value={video.value} onChange={(e) => video.onChange(e.target.value)} maxLength={500} placeholder="https://.../video.mp4" />
          </Field>
          {embed ? (
            <iframe src={embed} title="Xem trước video" className="aspect-video w-full max-w-xl rounded-[2px] border border-[var(--border-default)]" allowFullScreen />
          ) : (
            isValidUrl(video.value.trim()) && (
              <video src={video.value.trim()} controls className="w-full max-w-xl rounded-[2px] border border-[var(--border-default)]" />
            )
          )}
        </>
      )}
      {model && (
        <Field label={model.label} error={err(model.errKey)} hint="Đường dẫn tệp .glb / .gltf.">
          <StaffFormInput type="url" value={model.value} onChange={(e) => model.onChange(e.target.value)} maxLength={500} placeholder="https://.../model.glb" />
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

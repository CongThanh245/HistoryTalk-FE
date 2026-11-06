"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StaffFormInput, StaffFormLabel, StaffFormSelect } from "@/components/staff/staff-form";
import { cn } from "@/lib/utils/cn";
import {
  VOICE_GENDER_LABELS,
  VOICE_PREVIEW_MAX_LENGTH,
  VOICE_REGION_LABELS,
  voiceService,
  type CharacterVoice,
} from "@/services/voice.service";

export type CharacterVoiceValue = {
  /** "" = default voice. */
  voiceId: string;
  /** "" = default "ta". */
  selfPronoun: string;
  /** "" = default "ngươi". */
  addressPronoun: string;
};

export const EMPTY_CHARACTER_VOICE: CharacterVoiceValue = { voiceId: "", selfPronoun: "", addressPronoun: "" };

const PRONOUN_MAX_LENGTH = 30;
const PRONOUN_PATTERN = /^[\p{L} ]*$/u;
const PRONOUN_ERROR = "Cách xưng hô chỉ gồm chữ cái, tối đa 30 ký tự";

/** Same rule as the backend: letters and spaces only, at most 30 characters. */
export function validatePronoun(value: string): string | undefined {
  const v = value.trim();
  return v.length > PRONOUN_MAX_LENGTH || !PRONOUN_PATTERN.test(v) ? PRONOUN_ERROR : undefined;
}

const DEFAULT_VOICE = "__default__";
const ALL = "ALL";

/** Quick picks by period; modern characters sound wrong with "ta" / "ngươi". */
const PRONOUN_PRESETS: { self: string; address: string; hint: string }[] = [
  { self: "", address: "", hint: "Phong kiến (mặc định)" },
  { self: "tôi", address: "bạn", hint: "Cận đại, hiện đại" },
  { self: "tôi", address: "cháu", hint: "Hiện đại, thân mật" },
];

function voiceLabel(voice: CharacterVoice) {
  const parts = [voice.id, VOICE_GENDER_LABELS[voice.gender], VOICE_REGION_LABELS[voice.region], voice.style];
  return `${parts.filter(Boolean).join(" · ")}${voice.recommended ? " (Đề xuất)" : ""}`;
}

/**
 * Voice and pronouns of a character, for content admins and teachers. The voice list and preview need the
 * voice server; when it is down the fields still save.
 */
export function CharacterVoiceFields({
  value,
  onChange,
  disabled,
  errors,
}: {
  value: CharacterVoiceValue;
  onChange: (patch: Partial<CharacterVoiceValue>) => void;
  disabled?: boolean;
  errors?: { selfPronoun?: string; addressPronoun?: string; voiceId?: string };
}) {
  const voicesQuery = useQuery({
    queryKey: ["voices"],
    queryFn: voiceService.list,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
  const voices = React.useMemo(() => voicesQuery.data ?? [], [voicesQuery.data]);
  const defaultVoice = voices.find((v) => v.isDefault);

  const [gender, setGender] = React.useState<CharacterVoice["gender"] | typeof ALL>(ALL);
  const [region, setRegion] = React.useState<CharacterVoice["region"] | typeof ALL>(ALL);
  const shownVoices = voices.filter(
    (v) => v.id === value.voiceId || ((gender === ALL || v.gender === gender) && (region === ALL || v.region === region)),
  );
  const voiceOptions = [
    { value: DEFAULT_VOICE, label: `Mặc định${defaultVoice ? ` (${defaultVoice.id}, nam)` : " (Thiện Minh, nam)"}` },
    ...shownVoices.map((v) => ({ value: v.id, label: voiceLabel(v) })),
  ];
  // A saved voice that is no longer offered still shows, so saving does not silently change it.
  if (value.voiceId && !voices.some((v) => v.id === value.voiceId)) {
    voiceOptions.push({ value: value.voiceId, label: value.voiceId });
  }

  const [previewText, setPreviewText] = React.useState("");
  const [previewState, setPreviewState] = React.useState<"idle" | "loading" | "playing">("idle");
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const stopPreview = React.useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      URL.revokeObjectURL(audio.src);
      audioRef.current = null;
    }
    setPreviewState("idle");
  }, []);
  React.useEffect(() => stopPreview, [stopPreview]);

  const handlePreview = async () => {
    if (previewState !== "idle") {
      stopPreview();
      return;
    }
    const voiceId = value.voiceId || defaultVoice?.id;
    if (!voiceId) return;
    setPreviewState("loading");
    try {
      const blob = await voiceService.preview(voiceId, previewText);
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = stopPreview;
      await audio.play();
      setPreviewState("playing");
    } catch (error) {
      stopPreview();
      toast.error(error instanceof Error ? error.message : "Không nghe thử được giọng này.");
    }
  };

  const voicesUnavailable = voicesQuery.isError;

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <StaffFormLabel>Giọng đọc</StaffFormLabel>
        <div className="flex flex-wrap items-center gap-1.5">
          {([ALL, "MALE", "FEMALE"] as const).map((g) => (
            <button
              key={g}
              type="button"
              disabled={disabled}
              onClick={() => setGender(g)}
              className={cn(
                "rounded-sm border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                gender === g
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                  : "border-[var(--border-strong)] text-content-text hover:border-[var(--text-primary)]",
              )}
            >
              {g === ALL ? "Tất cả" : VOICE_GENDER_LABELS[g]}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-[var(--border-default)]" aria-hidden="true" />
          {([ALL, "NORTH", "CENTRAL", "SOUTH"] as const).map((r) => (
            <button
              key={r}
              type="button"
              disabled={disabled}
              onClick={() => setRegion(r)}
              className={cn(
                "rounded-sm border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                region === r
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                  : "border-[var(--border-strong)] text-content-text hover:border-[var(--text-primary)]",
              )}
            >
              {r === ALL ? "Mọi vùng" : VOICE_REGION_LABELS[r]}
            </button>
          ))}
        </div>
        <StaffFormSelect
          value={value.voiceId || DEFAULT_VOICE}
          onValueChange={(v) => onChange({ voiceId: v === DEFAULT_VOICE ? "" : v })}
          options={voiceOptions}
          disabled={disabled || voicesQuery.isLoading}
          placeholder={voicesQuery.isLoading ? "Đang tải danh sách giọng..." : "Chọn giọng"}
          searchable
        />
        {errors?.voiceId && <p className="text-xs text-accent-danger">{errors.voiceId}</p>}
        <p className="text-xs text-[var(--content-muted)]">
          {voicesUnavailable
            ? "Không tải được danh sách giọng, có thể máy chủ giọng đọc đang tắt. Bạn vẫn lưu nhân vật được."
            : "Nhân vật nữ nên chọn giọng nữ. Để mặc định là giọng nam Thiện Minh."}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <StaffFormInput
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value.slice(0, VOICE_PREVIEW_MAX_LENGTH))}
            placeholder="Câu nghe thử (để trống sẽ đọc câu mẫu)"
            className="min-w-0 flex-1 basis-60"
            aria-label="Câu nghe thử"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={voicesUnavailable || (!value.voiceId && !defaultVoice)}
            onClick={handlePreview}
          >
            {previewState === "loading" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : previewState === "playing" ? (
              <Square className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Play className="mr-1.5 h-3.5 w-3.5" />
            )}
            {previewState === "playing" ? "Dừng" : "Nghe thử"}
          </Button>
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">Cách xưng hô</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <StaffFormLabel htmlFor="character-self-pronoun" className="text-xs font-medium">
              Nhân vật tự xưng
            </StaffFormLabel>
            <StaffFormInput
              id="character-self-pronoun"
              value={value.selfPronoun}
              onChange={(e) => onChange({ selfPronoun: e.target.value })}
              placeholder="ta"
              maxLength={PRONOUN_MAX_LENGTH}
              disabled={disabled}
              aria-invalid={!!errors?.selfPronoun}
            />
            {errors?.selfPronoun && <p className="text-xs text-accent-danger">{errors.selfPronoun}</p>}
          </div>
          <div className="grid gap-1">
            <StaffFormLabel htmlFor="character-address-pronoun" className="text-xs font-medium">
              Gọi người học
            </StaffFormLabel>
            <StaffFormInput
              id="character-address-pronoun"
              value={value.addressPronoun}
              onChange={(e) => onChange({ addressPronoun: e.target.value })}
              placeholder="ngươi"
              maxLength={PRONOUN_MAX_LENGTH}
              disabled={disabled}
              aria-invalid={!!errors?.addressPronoun}
            />
            {errors?.addressPronoun && <p className="text-xs text-accent-danger">{errors.addressPronoun}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[var(--content-muted)]">Gợi ý:</span>
          {PRONOUN_PRESETS.map((preset) => (
            <button
              key={`${preset.self}/${preset.address}`}
              type="button"
              disabled={disabled}
              title={preset.hint}
              onClick={() => onChange({ selfPronoun: preset.self, addressPronoun: preset.address })}
              className="rounded-sm border border-[var(--border-strong)] px-2 py-0.5 text-xs text-content-text transition-colors hover:border-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {preset.self || "ta"} / {preset.address || "ngươi"}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--content-muted)]">
          Để trống thì nhân vật xưng &ldquo;ta&rdquo; và gọi &ldquo;ngươi&rdquo;. Nhân vật hiện đại nên dùng
          &ldquo;tôi&rdquo; / &ldquo;bạn&rdquo;.
        </p>
      </div>
    </div>
  );
}

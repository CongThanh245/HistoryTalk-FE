"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 as SpinnerIcon, MousePointer2, Play, RotateCcw, Square } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StaffFormLabel } from "@/components/staff/staff-form";
import { cn } from "@/lib/utils/cn";
import {
  DEFAULT_PORTRAIT_SETTINGS,
  portraitSettingsService,
  type PortraitDisplayMode,
  type PortraitPoint,
  type PortraitPoints,
  type PortraitSettings,
} from "@/services/media.service";
import { queryKeys } from "@/shared/query-key";
import type { AnalyserLike } from "@/components/chat/FBXCharacterViewer";
import {
  detectPortraitFace,
  layoutFromPoints,
  loadPortraitImage,
  pointsFromLayout,
} from "@/components/chat/portrait-face";

const TalkingPortrait = dynamic(
  () => import("@/components/chat/talking-portrait").then((m) => m.TalkingPortrait),
  { ssr: false },
);

const NO_ANALYSER: React.RefObject<AnalyserLike | null> = { current: null };
const TEST_SPEECH_MS = 4000;

const MODES: { value: PortraitDisplayMode; label: string; hint: string }[] = [
  { value: "AUTO", label: "Tự động", hint: "Có mô hình 3D thì dùng 3D, chưa có thì dùng chân dung" },
  { value: "PORTRAIT", label: "Luôn chân dung", hint: "Luôn dùng ảnh nhân vật, kể cả khi có mô hình 3D" },
  { value: "MODEL_3D", label: "Luôn 3D", hint: "Luôn dùng mô hình 3D" },
];

const MARKERS: { key: keyof PortraitPoints; label: string; color: string }[] = [
  { key: "eyeLeft", label: "Mắt trái", color: "#38bdf8" },
  { key: "eyeRight", label: "Mắt phải", color: "#38bdf8" },
  { key: "mouth", label: "Giữa miệng", color: "#f43f5e" },
  { key: "chin", label: "Cằm", color: "#facc15" },
];

/** Used when no face is found, so there is something to drag. */
const FALLBACK_POINTS: PortraitPoints = {
  eyeLeft: [0.45, 0.25],
  eyeRight: [0.55, 0.25],
  mouth: [0.5, 0.33],
  chin: [0.5, 0.38],
};

type Detection = {
  width: number;
  height: number;
  /** null: no face found. */
  points: PortraitPoints | null;
};

function sameSettings(a: PortraitSettings, b: PortraitSettings) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Lets content staff check and tune how a character talks on the call screen:
 * display mode, face points when detection is off, mouth strength and framing.
 * Stored separately from the character form, with its own save.
 */
export function PortraitSettingsEditor({
  characterId,
  imageUrl,
  disabled,
}: {
  characterId: string;
  /** The saved image; a picked but unsaved file has no URL yet. */
  imageUrl?: string;
  disabled?: boolean;
}) {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: queryKeys.characters.portraitSettings(characterId),
    queryFn: () => portraitSettingsService.get(characterId),
    retry: false,
  });
  const saved = settingsQuery.data ?? DEFAULT_PORTRAIT_SETTINGS;
  const [draft, setDraft] = React.useState<PortraitSettings>(saved);
  React.useEffect(() => setDraft(saved), [saved]);

  const [detection, setDetection] = React.useState<Detection | null>(null);
  const [detecting, setDetecting] = React.useState(false);
  React.useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    setDetecting(true);
    (async () => {
      const image = await loadPortraitImage(imageUrl);
      const face = await detectPortraitFace(imageUrl, image).catch(() => null);
      if (cancelled) return;
      setDetection({
        width: image.naturalWidth,
        height: image.naturalHeight,
        points: face ? pointsFromLayout(face) : null,
      });
    })()
      .catch(() => !cancelled && setDetection(null))
      .finally(() => !cancelled && setDetecting(false));
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const [speaking, setSpeaking] = React.useState(false);
  React.useEffect(() => {
    if (!speaking) return;
    const timer = window.setTimeout(() => setSpeaking(false), TEST_SPEECH_MS);
    return () => window.clearTimeout(timer);
  }, [speaking]);

  const [placing, setPlacing] = React.useState(false);
  const manualPoints = draft.points && draft.imageUrl === imageUrl ? draft.points : undefined;
  const shownPoints = manualPoints ?? detection?.points ?? FALLBACK_POINTS;

  const saveMutation = useMutation({
    mutationFn: (settings: PortraitSettings) => portraitSettingsService.save(characterId, settings),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.characters.portraitSettings(characterId), result);
      toast.success("Đã lưu thiết lập chân dung");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Không lưu được thiết lập chân dung"),
  });

  const update = (patch: Partial<PortraitSettings>) => setDraft((s) => ({ ...s, ...patch }));
  const movePoint = (key: keyof PortraitPoints, point: PortraitPoint) =>
    update({ points: { ...shownPoints, [key]: point }, imageUrl });
  const useDetection = () => update({ points: undefined, imageUrl: undefined });

  const dirty = !sameSettings(draft, saved);
  const locked = disabled || saveMutation.isPending;

  if (!imageUrl) {
    return (
      <div className="grid gap-1.5">
        <StaffFormLabel>Chân dung động khi gọi</StaffFormLabel>
        <p className="text-xs text-[var(--content-muted)]">
          Lưu ảnh nhân vật trước để xem và chỉnh chân dung động.
        </p>
      </div>
    );
  }

  const faceStatus = detecting
    ? "Đang nhận diện khuôn mặt..."
    : manualPoints
      ? "Đang dùng điểm đặt bằng tay."
      : detection?.points
        ? "Đã tự nhận diện khuôn mặt. Nếu miệng mở sai chỗ, hãy chỉnh điểm bằng tay."
        : "Không nhận ra khuôn mặt trong ảnh. Hãy đặt điểm bằng tay, nếu không cuộc gọi sẽ dùng mô hình 3D.";

  return (
    <div className="grid gap-3 rounded-sm border border-[var(--card-light-border)] p-3">
      <div className="grid gap-0.5">
        <StaffFormLabel>Chân dung động khi gọi</StaffFormLabel>
        <p className="text-xs text-[var(--content-muted)]">
          Ảnh nhân vật cử động miệng, mắt và đầu theo giọng nói trong cuộc gọi.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
        <div className="grid content-start gap-2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-[#141210]">
            {placing && detection ? (
              <PointPlacer
                imageUrl={imageUrl}
                width={detection.width}
                height={detection.height}
                points={shownPoints}
                disabled={locked}
                onMove={movePoint}
              />
            ) : (
              <TalkingPortrait
                imageUrl={imageUrl}
                isSpeaking={speaking}
                ttsAnalyserRef={NO_ANALYSER}
                settings={{ ...draft, points: manualPoints, imageUrl }}
              />
            )}
          </div>
          {placing ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setPlacing(false)}>
              Xong, xem thử
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setSpeaking((v) => !v)}>
              {speaking ? <Square className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
              {speaking ? "Dừng" : "Thử nói"}
            </Button>
          )}
        </div>

        <div className="grid content-start gap-4">
          <div className="grid gap-1.5">
            <span className="text-xs font-medium">Hiển thị khi gọi 3D</span>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((mode) => (
                <Button
                  key={mode.value}
                  type="button"
                  size="sm"
                  variant={draft.mode === mode.value ? "default" : "outline"}
                  disabled={locked}
                  onClick={() => update({ mode: mode.value })}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-[var(--content-muted)]">
              {MODES.find((m) => m.value === draft.mode)?.hint}
            </p>
          </div>

          <RangeField
            label="Độ mở miệng"
            min={0.4}
            max={1.6}
            value={draft.mouthOpen}
            left="Ít"
            right="Nhiều"
            disabled={locked}
            onChange={(mouthOpen) => update({ mouthOpen })}
          />
          <RangeField
            label="Khung hình"
            min={0.7}
            max={1.6}
            value={draft.zoom}
            left="Xa"
            right="Gần"
            disabled={locked}
            onChange={(zoom) => update({ zoom })}
          />

          <div className="grid gap-1.5">
            <span className="text-xs font-medium">Điểm trên khuôn mặt</span>
            <p className="text-xs text-[var(--content-muted)]">{faceStatus}</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={placing ? "default" : "outline"}
                disabled={locked || !detection}
                onClick={() => setPlacing((v) => !v)}
              >
                <MousePointer2 className="mr-1.5 h-3.5 w-3.5" />
                Chỉnh điểm bằng tay
              </Button>
              {manualPoints && (
                <Button type="button" size="sm" variant="outline" disabled={locked} onClick={useDetection}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Dùng nhận diện tự động
                </Button>
              )}
            </div>
            {placing && (
              <p className="text-xs text-[var(--content-muted)]">
                Kéo các điểm vào đúng giữa hai mắt, giữa khe miệng và đỉnh cằm.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              disabled={locked || !dirty}
              onClick={() => saveMutation.mutate(draft)}
            >
              {saveMutation.isPending && <SpinnerIcon className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Lưu thiết lập chân dung
            </Button>
            {dirty && !saveMutation.isPending && (
              <button
                type="button"
                className="text-xs text-[var(--content-muted)] underline-offset-2 hover:underline"
                onClick={() => setDraft(saved)}
              >
                Bỏ thay đổi
              </button>
            )}
            {disabled && (
              <span className="text-xs text-[var(--content-muted)]">Bấm Chỉnh sửa để thay đổi.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RangeField({
  label,
  min,
  max,
  value,
  left,
  right,
  disabled,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  left: string;
  right: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between text-xs font-medium">
        {label}
        <span className="tabular-nums text-[var(--content-muted)]">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--accent-gold)]"
      />
      <span className="flex justify-between text-[11px] text-[var(--content-muted)]">
        <span>{left}</span>
        <span>{right}</span>
      </span>
    </label>
  );
}

/**
 * The image zoomed on the face, with a draggable marker per point. The view is
 * fixed while editing so the image doesn't move under the pointer.
 */
function PointPlacer({
  imageUrl,
  width,
  height,
  points,
  disabled,
  onMove,
}: {
  imageUrl: string;
  width: number;
  height: number;
  points: PortraitPoints;
  disabled?: boolean;
  onMove: (key: keyof PortraitPoints, point: PortraitPoint) => void;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [view] = React.useState(() => {
    const face = layoutFromPoints(points, width, height);
    const size = Math.min(Math.max(face.faceHeight * 1.7, 60), Math.max(width, height));
    return { x: face.faceCenter[0] - size / 2, y: face.faceCenter[1] - size * 0.55, size };
  });
  const [dragging, setDragging] = React.useState<keyof PortraitPoints | null>(null);

  // The box is 4:5, the view square: the view spans the width, centered vertically.
  const toBox = ([x, y]: PortraitPoint) => ({
    left: `${((x * width - view.x) / view.size) * 100}%`,
    top: `${(((y * height - view.y) / view.size) * 0.8 + 0.1) * 100}%`,
  });
  const fromPointer = (event: React.PointerEvent): PortraitPoint | null => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const u = (event.clientX - rect.left) / rect.width;
    const v = ((event.clientY - rect.top) / rect.height - 0.1) / 0.8;
    const clamp = (n: number) => Math.min(Math.max(n, 0), 1);
    return [clamp((view.x + u * view.size) / width), clamp((view.y + v * view.size) / height)];
  };

  return (
    <div
      ref={boxRef}
      className="absolute inset-0 touch-none select-none"
      onPointerMove={(event) => {
        if (!dragging) return;
        const point = fromPointer(event);
        if (point) onMove(dragging, point);
      }}
      onPointerUp={() => setDragging(null)}
      onPointerLeave={() => setDragging(null)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- crop of a remote image for point placing */}
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="pointer-events-none absolute max-w-none"
        style={{
          width: `${(width / view.size) * 100}%`,
          left: `${(-view.x / view.size) * 100}%`,
          top: `${((-view.y / view.size) * 0.8 + 0.1) * 100}%`,
        }}
      />
      {MARKERS.map((marker) => (
        <button
          key={marker.key}
          type="button"
          aria-label={marker.label}
          title={marker.label}
          disabled={disabled}
          onPointerDown={(event) => {
            event.preventDefault();
            (event.currentTarget.parentElement as HTMLElement).setPointerCapture(event.pointerId);
            setDragging(marker.key);
          }}
          className={cn(
            "absolute -ml-2 -mt-2 h-4 w-4 cursor-grab rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]",
            dragging === marker.key && "cursor-grabbing scale-125",
          )}
          style={{ ...toBox(points[marker.key]), background: marker.color }}
        />
      ))}
      <div className="pointer-events-none absolute bottom-1 left-1 right-1 flex flex-wrap justify-center gap-x-2 text-[10px] text-white/80">
        {MARKERS.filter((m, i) => i !== 1).map((marker) => (
          <span key={marker.key} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: marker.color }} />
            {marker.key === "eyeLeft" ? "Mắt" : marker.label}
          </span>
        ))}
      </div>
    </div>
  );
}

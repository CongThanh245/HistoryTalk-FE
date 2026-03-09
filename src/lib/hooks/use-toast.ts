// "use client";

// /**
//  * HistoryTalk – useToast + Toaster
//  * Base: @radix-ui/react-toast  |  Icons: @phosphor-icons/react
//  * Singleton listener pattern — no Redux, no Context, no localStorage
//  *
//  * Mount <Toaster /> once in src/app/layout.tsx
//  * Usage:
//  *   const { toast } = useToast();
//  *   toast.success("Title", "Description");
//  *   toast({ variant: "warning", title: "…", duration: 6000 });
//  */

// import * as React from "react";
// import * as ToastPrimitives from "@radix-ui/react-toast";
// import {
//   CheckCircle2,
//   AlertCircle,
//   AlertTriangle,
//   Info,
//   XIcon,
// } from "@phosphor-icons/react";

// // ─────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────

// export type ToastVariant =
//   | "default"
//   | "success"
//   | "destructive"
//   | "warning"
//   | "info";

// export interface ToastOptions {
//   id?: string;
//   variant?: ToastVariant;
//   title: string;
//   description?: string;
//   duration?: number;
// }

// interface ToastState extends Required<Omit<ToastOptions, "description">> {
//   description?: string;
//   open: boolean;
// }

// type Listener = (toasts: ToastState[]) => void;

// // ─────────────────────────────────────────────
// // Singleton store
// // ─────────────────────────────────────────────

// let toasts: ToastState[] = [];
// const listeners: Set<Listener> = new Set();
// let counter = 0;

// function emit() {
//   listeners.forEach((l) => l([...toasts]));
// }

// function addToast(opts: ToastOptions) {
//   const id = opts.id ?? `ht-toast-${++counter}`;
//   const next: ToastState = {
//     id,
//     variant: opts.variant ?? "default",
//     title: opts.title,
//     description: opts.description,
//     duration: opts.duration ?? 4000,
//     open: true,
//   };

//   // Cap at 3 visible toasts
//   toasts = [next, ...toasts.filter((t) => t.open)].slice(0, 3);
//   emit();
// }

// function dismissToast(id: string) {
//   toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t));
//   emit();
//   // Remove from array after animation
//   setTimeout(() => {
//     toasts = toasts.filter((t) => t.id !== id);
//     emit();
//   }, 400);
// }

// // ─────────────────────────────────────────────
// // Public API builders
// // ─────────────────────────────────────────────

// function buildToastFn() {
//   // Full options overload
//   function toast(opts: ToastOptions): void;
//   // Shorthand: toast.success / .error / .warning / .info
//   function toast(
//     title: string,
//     description?: string,
//     opts?: Partial<ToastOptions>
//   ): void;
//   function toast(
//     titleOrOpts: string | ToastOptions,
//     description?: string,
//     extra?: Partial<ToastOptions>
//   ) {
//     if (typeof titleOrOpts === "string") {
//       addToast({ title: titleOrOpts, description, ...extra });
//     } else {
//       addToast(titleOrOpts);
//     }
//   }

//   toast.success = (title: string, description?: string) =>
//     addToast({ variant: "success", title, description });
//   toast.error = (title: string, description?: string) =>
//     addToast({ variant: "destructive", title, description });
//   toast.warning = (title: string, description?: string) =>
//     addToast({ variant: "warning", title, description });
//   toast.info = (title: string, description?: string) =>
//     addToast({ variant: "info", title, description });

//   return toast;
// }

// // ─────────────────────────────────────────────
// // Hook
// // ─────────────────────────────────────────────

// export function useToast() {
//   const [state, setState] = React.useState<ToastState[]>([...toasts]);

//   React.useEffect(() => {
//     listeners.add(setState);
//     return () => {
//       listeners.delete(setState);
//     };
//   }, []);

//   return {
//     toasts: state,
//     toast: buildToastFn(),
//     dismiss: dismissToast,
//   };
// }

// // ─────────────────────────────────────────────
// // Design tokens (map variant → CSS vars)
// // ─────────────────────────────────────────────

// const VARIANT_CONFIG: Record<
//   ToastVariant,
//   {
//     icon: React.ElementType;
//     iconColorClass: string;
//     borderColorVar: string;
//     progressColorVar: string;
//     bgVar: string;
//     ringClass: string;
//   }
// > = {
//   default: {
//     icon: Info,
//     iconColorClass: "text-[--accent-blue]",
//     borderColorVar: "var(--border-strong)",
//     progressColorVar: "var(--accent-blue)",
//     bgVar: "var(--bg-surface)",
//     ringClass: "ring-1 ring-[--border-strong]",
//   },
//   success: {
//     icon: CheckCircle2,
//     iconColorClass: "text-[--toast-success-icon]",
//     borderColorVar: "var(--toast-success-border)",
//     progressColorVar: "var(--toast-success-progress)",
//     bgVar: "var(--toast-success-bg)",
//     ringClass: "ring-1 ring-[--toast-success-border]",
//   },
//   destructive: {
//     icon: AlertCircle,
//     iconColorClass: "text-[--toast-error-icon]",
//     borderColorVar: "var(--toast-error-border)",
//     progressColorVar: "var(--toast-error-progress)",
//     bgVar: "var(--toast-error-bg)",
//     ringClass: "ring-1 ring-[--toast-error-border]",
//   },
//   warning: {
//     icon: AlertTriangle,
//     iconColorClass: "text-[--toast-warning-icon]",
//     borderColorVar: "var(--toast-warning-border)",
//     progressColorVar: "var(--toast-warning-progress)",
//     bgVar: "var(--toast-warning-bg)",
//     ringClass: "ring-1 ring-[--toast-warning-border]",
//   },
//   info: {
//     icon: Info,
//     iconColorClass: "text-[--toast-info-icon]",
//     borderColorVar: "var(--toast-info-border)",
//     progressColorVar: "var(--toast-info-progress)",
//     bgVar: "var(--toast-info-bg)",
//     ringClass: "ring-1 ring-[--toast-info-border]",
//   },
// };

// // ─────────────────────────────────────────────
// // Progress bar (counts down duration ms)
// // ─────────────────────────────────────────────

// function ProgressBar({
//   duration,
//   color,
//   paused,
// }: {
//   duration: number;
//   color: string;
//   paused: boolean;
// }) {
//   return (
//     <div
//       className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-b-[var(--radius-md)]"
//       style={{ background: "rgba(255,255,255,0.06)" }}
//     >
//       <div
//         className="h-full origin-left"
//         style={{
//           background: color,
//           width: "100%",
//           animation: paused
//             ? "none"
//             : `ht-progress ${duration}ms linear forwards`,
//           opacity: 0.75,
//         }}
//       />
//     </div>
//   );
// }

// // ─────────────────────────────────────────────
// // Single Toast Item
// // ─────────────────────────────────────────────

// function ToastItem({ toast: t }: { toast: ToastState }) {
//   const cfg = VARIANT_CONFIG[t.variant];
//   const Icon = cfg.icon;
//   const [paused, setPaused] = React.useState(false);

//   return (
//     <ToastPrimitives.Root
//       open={t.open}
//       onOpenChange={(open) => {
//         if (!open) dismissToast(t.id);
//       }}
//       duration={t.duration}
//       className={[
//         // Layout
//         "relative flex items-start gap-3 px-4 pt-3 pb-5",
//         "w-[360px] max-w-[calc(100vw-2rem)]",
//         "rounded-[var(--radius-md)] overflow-hidden",
//         // Colors & border
//         cfg.ringClass,
//         // Shadow & backdrop
//         "shadow-[var(--shadow-strong)]",
//         "backdrop-blur-sm",
//         // Animation
//         "data-[state=open]:animate-ht-slide-in",
//         "data-[state=closed]:animate-ht-slide-out",
//         // Swipe
//         "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
//         "data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform",
//         "data-[swipe=end]:animate-ht-slide-out",
//         // Cursor
//         "cursor-default select-none",
//       ].join(" ")}
//       style={{
//         background: cfg.bgVar,
//         borderLeft: `3px solid ${cfg.borderColorVar}`,
//       }}
//       onMouseEnter={() => setPaused(true)}
//       onMouseLeave={() => setPaused(false)}
//     >
//       {/* Icon */}
//       <span className={`mt-[2px] shrink-0 ${cfg.iconColorClass}`}>
//         <Icon size={18} strokeWidth={2} />
//       </span>

//       {/* Content */}
//       <div className="flex-1 min-w-0">
//         <ToastPrimitives.Title
//           className="text-[var(--text-primary)] text-[13px] leading-snug font-semibold truncate"
//           style={{ fontFamily: "'Georgia', serif" }}
//         >
//           {t.title}
//         </ToastPrimitives.Title>

//         {t.description && (
//           <ToastPrimitives.Description className="mt-0.5 text-[var(--text-secondary)] text-[12px] leading-relaxed line-clamp-2">
//             {t.description}
//           </ToastPrimitives.Description>
//         )}
//       </div>

//       {/* Close button */}
//       <ToastPrimitives.Close
//         className={[
//           "shrink-0 mt-[1px] p-0.5 rounded-[var(--radius-sm)]",
//           "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
//           "hover:bg-[var(--bg-elevated)]",
//           "transition-colors duration-150",
//           "focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-gold)]",
//         ].join(" ")}
//         aria-label="Đóng thông báo"
//       >
//         <XIcon size={14} />
//       </ToastPrimitives.Close>

//       {/* Progress bar */}
//       <ProgressBar
//         duration={t.duration}
//         color={cfg.progressColorVar}
//         paused={paused}
//       />
//     </ToastPrimitives.Root>
//   );
// }

// // ─────────────────────────────────────────────
// // Toaster — mount once in layout.tsx
// // ─────────────────────────────────────────────

// export function Toaster() {
//   const { toasts: activeToasts } = useToast();

//   return (
//     <>
//       {/* Inject keyframes + CSS vars for toasts */}
//       <style>{`
//         /* ── Toast-specific CSS variables ── */
//         :root {
//           /* Success */
//           --toast-success-bg:       rgba(20, 46, 30, 0.92);
//           --toast-success-border:   rgba(74, 178, 98, 0.55);
//           --toast-success-icon:     #4ab262;
//           --toast-success-progress: #4ab262;

//           /* Destructive / Error */
//           --toast-error-bg:         rgba(46, 18, 18, 0.92);
//           --toast-error-border:     rgba(184, 50, 42, 0.6);
//           --toast-error-icon:       #e05550;
//           --toast-error-progress:   #e05550;

//           /* Warning */
//           --toast-warning-bg:       rgba(46, 34, 10, 0.92);
//           --toast-warning-border:   rgba(255, 177, 98, 0.5);
//           --toast-warning-icon:     #ffb162;
//           --toast-warning-progress: #ffb162;

//           /* Info */
//           --toast-info-bg:          rgba(14, 30, 46, 0.92);
//           --toast-info-border:      rgba(143, 179, 200, 0.45);
//           --toast-info-icon:        #8fb3c8;
//           --toast-info-progress:    #8fb3c8;
//         }

//         /* ── Animations ── */
//         @keyframes ht-slide-in {
//           from { transform: translateX(calc(100% + 1.5rem)); opacity: 0; }
//           to   { transform: translateX(0);                   opacity: 1; }
//         }
//         @keyframes ht-slide-out {
//           from { transform: translateX(0);                   opacity: 1; }
//           to   { transform: translateX(calc(100% + 1.5rem)); opacity: 0; }
//         }
//         @keyframes ht-progress {
//           from { transform: scaleX(1); }
//           to   { transform: scaleX(0); }
//         }

//         .animate-ht-slide-in  { animation: ht-slide-in  0.32s cubic-bezier(.22,.68,0,1.2) forwards; }
//         .animate-ht-slide-out { animation: ht-slide-out 0.28s ease-in               forwards; }
//       `}</style>

//       <ToastPrimitives.Provider swipeDirection="right">
//         {activeToasts.map((t) => (
//           <ToastItem key={t.id} toast={t} />
//         ))}

//         <ToastPrimitives.Viewport
//           className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-3 outline-none"
//           style={{ width: 360, maxWidth: "calc(100vw - 2rem)" }}
//         />
//       </ToastPrimitives.Provider>
//     </>
//   );
// }
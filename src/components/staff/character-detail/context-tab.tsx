"use client";

import * as React from "react";
import {
  Link,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickCreateContextSheet } from "./quick-create-context-sheet";
import type { ContextTabProps } from "./types";

export function ContextTab({
  isCreated,
  eventOptions,
  isLoadingEvents,
  isMapContextPending,
  onUnmapContext,
  selectedContextId,
  setSelectedContextId,
  mappedContexts,
  handleMapContext,
  handleRemoveContext,
  hasDraftErrors,
  quickCreateOpen,
  setQuickCreateOpen,
  quickCtx,
  setQuickContextField,
  quickErrors,
  resetQuickCtx,
  createEvent,
}: ContextTabProps) {
  return (
    <TabsContent value="context" className="space-y-5 mt-0">
      {isCreated ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-accent-blue" />
            <p className="text-xs font-semibold uppercase tracking-widest text-content-heading">
              Liên kết bối cảnh lịch sử
            </p>
          </div>

          {mappedContexts.length > 0 && (
            <div className="space-y-2">
              {mappedContexts.map(ctx => (
                <div
                  key={ctx.contextId}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.06)] group"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[rgb(22,163,74)]" />
                  <p className="text-xs font-medium flex-1 text-green-700">
                    Đã liên kết: {ctx.name}
                  </p>
                  {onUnmapContext && (
                    <button
                      onClick={() => handleRemoveContext(ctx.contextId)}
                      disabled={isMapContextPending}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all text-red-600 disabled:opacity-50"
                      title="Gỡ liên kết"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={selectedContextId}
                onValueChange={setSelectedContextId}
                disabled={isLoadingEvents || isMapContextPending}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={isLoadingEvents ? "Đang tải..." : "Chọn bối cảnh để liên kết"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {eventOptions.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title} — {ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleMapContext}
              disabled={
                !selectedContextId ||
                hasDraftErrors ||
                isMapContextPending ||
                mappedContexts.some(c => c.contextId === selectedContextId)
              }
              className={`shrink-0 border-0 transition-all duration-200 ${
                selectedContextId && !mappedContexts.some(c => c.contextId === selectedContextId)
                  ? "bg-[var(--accent-blue)] text-[var(--bg-deep)] hover:brightness-90 hover:shadow-sm cursor-pointer"
                  : ""
              }`}
            >
              <Link className="h-4 w-4 mr-1.5" />
              {isMapContextPending ? "Đang liên kết..." : "Liên kết"}
            </Button>
          </div>

          {/* ── Quick-create context — Sheet trigger ── */}
          <button
            type="button"
            className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-black/[0.04] border border-card-light-border bg-transparent text-accent-blue"
            onClick={() => setQuickCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            Tạo nhanh bối cảnh mới
            <span
              className="ml-auto text-[10px] font-normal px-1.5 py-0.5 rounded bg-[rgba(59,130,246,0.1)] text-accent-blue"
            >
              Mới
            </span>
          </button>

          {/* ── Quick-create Sheet ── */}
          <QuickCreateContextSheet
            open={quickCreateOpen}
            onOpenChange={setQuickCreateOpen}
            quickCtx={quickCtx}
            setQuickContextField={setQuickContextField}
            quickErrors={quickErrors}
            resetQuickCtx={resetQuickCtx}
            createEvent={createEvent}
            onCreated={(newCtxId) => setSelectedContextId(newCtxId)}
          />
        </div>
      ) : (
        <div
          className="rounded-xl border border-dashed border-card-light-border px-4 py-8 text-center"
        >
          <Link className="h-5 w-5 mx-auto mb-2 text-content-muted" />
          <p className="text-sm text-content-muted">
            Tạo nhân vật trước để liên kết với bối cảnh lịch sử.
          </p>
        </div>
      )}
    </TabsContent>
  );
}

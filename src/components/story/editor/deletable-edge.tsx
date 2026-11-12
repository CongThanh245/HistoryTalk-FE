"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { useStoryEditor } from "@/features/story/editor-store";

/** Bezier edge with a remove button at its middle, shown on hover or when selected. */
export function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, selected, style }: EdgeProps) {
  const onEdgesChange = useStoryEditor((s) => s.onEdgesChange);
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} interactionWidth={24} />
      {/* Labels render outside the edge's <g>, so the button follows selection (click an edge to select it). */}
      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            aria-label="Xóa dây nối"
            title="Xóa dây nối (Delete)"
            onClick={() => onEdgesChange([{ type: "remove", id }])}
            className="nodrag nopan story-fade-in absolute grid size-6 cursor-pointer place-items-center rounded-full border border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--accent-gold)] shadow-md hover:bg-[var(--accent-gold)] hover:text-[var(--text-inverse)]"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "all" }}
          >
            <X className="size-3.5" strokeWidth={3} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

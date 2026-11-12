"use client";

import { createContext, useContext } from "react";
import type { StoryIssue } from "@/features/story/types";

type EditorContextValue = {
  issuesByNode: Map<string, StoryIssue[]>;
  /** Source+handle pairs that already have an outgoing edge ("id:handle"). */
  connectedHandles: Set<string>;
};

export const EditorContext = createContext<EditorContextValue>({
  issuesByNode: new Map(),
  connectedHandles: new Set(),
});

export const useEditorContext = () => useContext(EditorContext);

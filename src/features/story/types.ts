import type { Edge, Node } from "@xyflow/react";

/** The kinds of step a story is made of. */
/**
 * Free questions to a character are not a story step: the player opens the
 * existing chat with the character on screen instead.
 */
export type StoryNodeKind = "start" | "line" | "choice" | "quiz" | "end";

export type Expression = "neutral" | "happy" | "serious" | "sad" | "angry" | "surprised";

export type StoryOption = { id: string; label: string };

export type StartData = { kind: "start"; note: string };

/** One line of dialogue (or narration when there is no speaker). */
export type LineData = {
  kind: "line";
  speakerId: string | null;
  text: string;
  expression: Expression;
  /** Background preset id; null keeps the previous scene's background. */
  background: string | null;
};

/** The learner picks a branch. Each option is an output handle. */
export type ChoiceData = {
  kind: "choice";
  speakerId: string | null;
  prompt: string;
  options: StoryOption[];
};

/** A checkpoint question. Outputs: "correct" and "wrong". */
export type QuizData = {
  kind: "quiz";
  speakerId: string | null;
  question: string;
  answers: StoryOption[];
  correctId: string | null;
  explanation: string;
};

export type EndData = {
  kind: "end";
  title: string;
  summary: string;
  xp: number;
  unlockCharacters: boolean;
};

export type StoryNodeData = StartData | LineData | ChoiceData | QuizData | EndData;

export type StoryFlowNode = Node<StoryNodeData, StoryNodeKind>;
export type StoryFlowEdge = Edge;

export type StoryStatus = "draft" | "published";

export type StoryDoc = {
  id: string;
  title: string;
  contextId: string;
  contextName: string;
  narratorId: string | null;
  status: StoryStatus;
  updatedAt: string;
  nodes: StoryFlowNode[];
  edges: StoryFlowEdge[];
};

export type StoryCharacter = {
  id: string;
  name: string;
  title: string;
  /** Full-body or bust image with a transparent background works best. */
  portraitUrl: string | null;
  accent: string;
};

export type StoryBackground = {
  id: string;
  name: string;
  /** CSS background value: a gradient, or a url(). */
  css: string;
};

export type StoryIssue = {
  nodeId: string;
  level: "error" | "warning";
  message: string;
};

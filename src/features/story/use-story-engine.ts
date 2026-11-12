"use client";

import { useCallback, useMemo, useState } from "react";
import { nextNodeId } from "./graph-utils";
import { DEFAULT_BACKGROUND, findCharacter } from "./mock-data";
import { NARRATOR_LABEL } from "./story-meta";
import type { StoryFlowEdge, StoryFlowNode } from "./types";

export type LogEntry = { id: string; speaker: string; text: string; tone?: "choice" | "question" };

type QuizResult = { pickedId: string; correct: boolean };

/** Background in effect at a node: the nearest line before it that set one. */
function backgroundBefore(nodes: StoryFlowNode[], edges: StoryFlowEdge[], id: string) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  let current: string | undefined = id;
  while (current && !seen.has(current)) {
    seen.add(current);
    const d = byId.get(current)?.data;
    if (d?.kind === "line" && d.background) return d.background;
    current = edges.find((e) => e.target === current)?.source;
  }
  return DEFAULT_BACKGROUND;
}

/**
 * Walks a story graph for the visual-novel player. Pure client state, so the
 * same hook can drive the staff preview and (later) the learner screen.
 */
export function useStoryEngine(nodes: StoryFlowNode[], edges: StoryFlowEdge[], startAt?: string | null) {
  const startId = useMemo(() => {
    if (startAt && nodes.some((n) => n.id === startAt)) return startAt;
    const start = nodes.find((n) => n.data.kind === "start");
    return start ? nextNodeId(edges, start.id, "next") : null;
  }, [nodes, edges, startAt]);

  const [currentId, setCurrentId] = useState<string | null>(startId);
  const [background, setBackground] = useState(() => (startId ? backgroundBefore(nodes, edges, startId) : DEFAULT_BACKGROUND));
  const [log, setLog] = useState<LogEntry[]>([]);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [steps, setSteps] = useState(0);

  const node = useMemo(() => nodes.find((n) => n.id === currentId) ?? null, [nodes, currentId]);
  const speaker = node && "speakerId" in node.data ? findCharacter(node.data.speakerId) : null;
  const speakerName = speaker?.name ?? NARRATOR_LABEL;

  const pushLog = useCallback((entry: Omit<LogEntry, "id">) => {
    setLog((l) => [...l, { ...entry, id: `${l.length}` }]);
  }, []);

  const goTo = useCallback(
    (id: string | null) => {
      const target = nodes.find((n) => n.id === id);
      if (target?.data.kind === "line" && target.data.background) setBackground(target.data.background);
      setQuiz(null);
      setSteps((s) => s + 1);
      // A missing target means a dangling branch: the player shows it as a dead end.
      setCurrentId(id ?? "__dead_end__");
    },
    [nodes],
  );

  /** Leave the current node through one of its handles. */
  const follow = useCallback(
    (handle: string) => {
      if (!node) return;
      goTo(nextNodeId(edges, node.id, handle));
    },
    [node, edges, goTo],
  );

  const advance = useCallback(() => {
    if (node?.data.kind !== "line") return;
    pushLog({ speaker: speakerName, text: node.data.text });
    follow("next");
  }, [node, speakerName, pushLog, follow]);

  const choose = useCallback(
    (optionId: string) => {
      if (node?.data.kind !== "choice") return;
      const picked = node.data.options.find((o) => o.id === optionId);
      if (node.data.prompt) pushLog({ speaker: speakerName, text: node.data.prompt, tone: "question" });
      if (picked) pushLog({ speaker: "Bạn", text: picked.label, tone: "choice" });
      follow(optionId);
    },
    [node, speakerName, pushLog, follow],
  );

  const answerQuiz = useCallback(
    (answerId: string) => {
      if (node?.data.kind !== "quiz" || quiz) return;
      const correct = answerId === node.data.correctId;
      setQuiz({ pickedId: answerId, correct });
      setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
      const picked = node.data.answers.find((a) => a.id === answerId);
      pushLog({ speaker: speakerName, text: node.data.question, tone: "question" });
      if (picked) pushLog({ speaker: "Bạn", text: `${picked.label} ${correct ? "✓" : "✗"}`, tone: "choice" });
    },
    [node, quiz, speakerName, pushLog],
  );

  const continueAfterQuiz = useCallback(() => {
    if (node?.data.kind !== "quiz" || !quiz) return;
    const wrongTarget = nextNodeId(edges, node.id, "wrong");
    // No wrong branch: everyone continues on the correct one.
    goTo(quiz.correct || !wrongTarget ? nextNodeId(edges, node.id, "correct") : wrongTarget);
  }, [node, quiz, edges, goTo]);

  const restart = useCallback(() => {
    setLog([]);
    setScore({ correct: 0, total: 0 });
    setSteps(0);
    setBackground(startId ? backgroundBefore(nodes, edges, startId) : DEFAULT_BACKGROUND);
    setQuiz(null);
    setCurrentId(startId);
  }, [startId, nodes, edges]);

  return {
    node,
    isDeadEnd: currentId === "__dead_end__" || (!node && currentId !== null) || startId === null,
    speaker,
    speakerName,
    background,
    log,
    quiz,
    score,
    steps,
    advance,
    choose,
    answerQuiz,
    continueAfterQuiz,
    restart,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { GameMode, MODE_LABELS, randomMode } from "./types";
import { FactCardModal } from "./fact-card-modal";
import { FactTriggerButton } from "./fact-trigger-button";
import { GameGuessCharacter } from "./game-guess-character";
import { GameGuessEvent } from "./game-guess-event";
import { GameTimeline } from "./game-timeline";

export function HomeRightPanel() {
  const [mode, setMode] = useState<GameMode>("character");
  const [gameKey, setGameKey] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showFact, setShowFact] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(randomMode());
  }, []);

  const handleScore = useCallback((correct: boolean) => {
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
  }, []);

  return (
    <>
      {/* Fact modal portal */}
      {mounted && showFact && (
        <FactCardModal onClose={() => setShowFact(false)} />
      )}

      {/* Fixed floating trigger button */}
      {mounted && <FactTriggerButton onClick={() => setShowFact(true)} />}

      <div className="bg-card-light-bg border border-card-light-border rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(27,38,50,0.06)] flex flex-col min-h-[480px] max-h-[580px]">
        {/* Header */}
        <div className="px-4 pt-3 pb-2.5 border-b border-card-light-border flex items-center justify-between shrink-0 gap-3">
          <div className="min-w-0">
            <p className="m-0 text-xs font-bold text-content-heading whitespace-nowrap overflow-hidden text-ellipsis">
              {MODE_LABELS[mode]}
            </p>
            {score.total > 0 && (
              <p className="m-0 mt-px text-[10px] text-content-muted">
                {score.correct}/{score.total} câu đúng
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Switch game */}
            <button
              onClick={() => {
                setMode((m) => randomMode(m));
                setGameKey((k) => k + 1);
              }}
              className="text-[10px] font-semibold cursor-pointer px-2.5 py-1 rounded-md bg-transparent border border-card-light-border text-content-muted transition-all duration-100 whitespace-nowrap hover:border-accent-gold/40 hover:text-gold-on-light"
            >
              Game khác
            </button>
          </div>
        </div>

        {/* Game area */}
        <div className="flex-1 px-4 pt-3.5 pb-4 overflow-y-auto">
          {mode === "character" && (
            <GameGuessCharacter key={`c-${gameKey}`} onScore={handleScore} />
          )}
          {mode === "event" && (
            <GameGuessEvent key={`e-${gameKey}`} onScore={handleScore} />
          )}
          {mode === "timeline" && (
            <GameTimeline key={`t-${gameKey}`} onScore={handleScore} />
          )}
        </div>
      </div>
    </>
  );
}

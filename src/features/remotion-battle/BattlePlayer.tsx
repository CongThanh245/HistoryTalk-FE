"use client";
import React from 'react';
import { Player } from '@remotion/player';
import { BattleComposition } from './BattleComposition';
import { BattleTimelineData } from './types';

interface Props {
  data: BattleTimelineData;
  width?: number;
  height?: number;
}

export const BattlePlayer: React.FC<Props> = ({ 
  data, 
  width = 1280, 
  height = 720 
}) => {
  // Calculate total duration based on all events
  const fps = 30;
  const totalFrames = data.totalDurationInSeconds * fps;

  return (
    <div className="w-full flex justify-center items-center rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black/50">
      <Player
        component={BattleComposition}
        inputProps={{ data }}
        durationInFrames={totalFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        style={{
          width: '100%',
          aspectRatio: `${width} / ${height}`,
        }}
        controls
        autoPlay
        loop
      />
    </div>
  );
};

"use client";
import React from 'react';
import { AbsoluteFill, Img, Sequence, useVideoConfig, Audio, interpolate, useCurrentFrame } from 'remotion';
import { BattleTimelineData } from './types';
import { BattleEventComponent } from './BattleEventComponent';

interface Props {
  data: BattleTimelineData;
}

export const BattleComposition: React.FC<Props> = ({ data }) => {
  const { fps, durationInFrames: totalFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  // Slow Ken Burns effect for background (scale up slightly and pan slowly)
  const bgScale = interpolate(frame, [0, totalFrames], [1, 1.15]);
  const bgPanX = interpolate(frame, [0, totalFrames], [0, -2]);
  const bgPanY = interpolate(frame, [0, totalFrames], [0, -1]);

  let currentStartFrame = 0;
  const eventsWithFrames = data.events.map((event) => {
    const durationInFrames = event.displayDuration * fps;
    const startFrame = currentStartFrame;
    currentStartFrame += durationInFrames;
    
    return {
      ...event,
      startFrame,
      durationInFrames
    };
  });

  return (
    <AbsoluteFill className="bg-slate-950 text-white relative font-sans overflow-hidden">
      {/* Background Image with Ken Burns effect */}
      <AbsoluteFill style={{
        transform: `scale(${bgScale}) translate(${bgPanX}%, ${bgPanY}%)`,
        transformOrigin: 'center center'
      }}>
        <Img 
          src={data.backgroundImageUrl} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
        />
      </AbsoluteFill>

      {/* Optional Background Audio */}
      {data.backgroundAudioUrl && (
        <Audio src={data.backgroundAudioUrl} volume={0.4} />
      )}

      {/* Cinematic Grid/Texture Overlay (Optional stylistic choice) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }}
      />

      {/* Render Events */}
      {eventsWithFrames.map((event, index) => (
        <Sequence
          key={`event-${index}-${event.step}`}
          from={event.startFrame}
          durationInFrames={event.durationInFrames}
        >
          <BattleEventComponent event={event} />
        </Sequence>
      ))}
      
      {/* Heavy Vignette for cinematic focus */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.85) 120%)' 
        }} 
      />

      {/* Cinematic Letterbox (Black bars top and bottom) */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black z-50 pointer-events-none flex items-center justify-between px-8">
        <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-white/90">
          {data.battleName}
        </h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Phe Ta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Quân Địch</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-black z-50 pointer-events-none flex items-center justify-center">
        <div className="text-[10px] uppercase tracking-[0.5em] text-white/30">
          HistoryTalk Interactive Archive
        </div>
      </div>
    </AbsoluteFill>
  );
};

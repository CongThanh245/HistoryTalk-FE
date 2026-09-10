"use client";
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BattleEventData } from './types';
import { cn } from '@/lib/utils/cn'; 
import { Shield, Swords, Ship, Target } from 'lucide-react';

interface Props {
  event: BattleEventData;
}

export const BattleEventComponent: React.FC<Props> = ({ event }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const durationInFrames = event.displayDuration * fps;
  
  // Fade in and out
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 15, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Marker pop animation
  const markerScale = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  // Card slide up animation
  const cardY = interpolate(
    frame,
    [0, 20],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Continuous pulsing ring for the marker
  const pulseScale = interpolate(
    frame % 60,
    [0, 30, 60],
    [1, 1.5, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  
  const pulseOpacity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.8, 0, 0.8],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const isEnemy = event.faction === 'enemy';
  const Icon = isEnemy ? Swords : Shield;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${event.positionX}%`,
        top: `${event.positionY}%`,
        opacity,
        transform: `translate(-50%, -50%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        zIndex: isEnemy ? 20 : 30,
      }}
    >
      {/* Animated Marker */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing background ring */}
        <div 
          className={cn(
            "absolute inset-0 rounded-full",
            isEnemy ? "bg-red-500" : "bg-blue-500"
          )}
          style={{
            transform: `scale(${pulseScale})`,
            opacity: pulseOpacity
          }}
        />
        
        {/* Main Marker */}
        <div 
          style={{ transform: `scale(${markerScale})` }}
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] z-10",
            isEnemy ? "bg-red-900 border-red-400 text-red-200" : "bg-blue-900 border-blue-400 text-blue-200"
          )}
        >
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>

      {/* Cinematic Info Card */}
      <div 
        className={cn(
          "w-80 p-5 rounded-lg shadow-2xl backdrop-blur-xl border border-white/20 text-white z-20 overflow-hidden relative",
          isEnemy ? "bg-gradient-to-b from-red-950/90 to-black/90 shadow-red-900/50" : "bg-gradient-to-b from-blue-950/90 to-black/90 shadow-blue-900/50"
        )}
        style={{ 
          transform: `scale(${markerScale}) translateY(${cardY}px)`,
        }}
      >
        {/* Decorative top bar */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          isEnemy ? "bg-gradient-to-r from-red-600 to-red-400" : "bg-gradient-to-r from-blue-600 to-blue-400"
        )} />

        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm",
            isEnemy ? "bg-red-950 text-red-400 border border-red-800" : "bg-blue-950 text-blue-400 border border-blue-800"
          )}>
            {event.timeLabel}
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2 leading-tight drop-shadow-md text-slate-100">
          {event.title}
        </h3>
        <p className="opacity-80 text-sm leading-relaxed drop-shadow-sm text-slate-300">
          {event.description}
        </p>
      </div>
    </div>
  );
};

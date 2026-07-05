export interface Position {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

export interface BattleEventData {
  step: number;
  timeLabel: string;
  title: string;
  description: string;
  faction: 'ally' | 'enemy';
  positionX: number;
  positionY: number;
  displayDuration: number; // in seconds
}

export interface BattleTimelineData {
  battleId: string;
  battleName: string;
  backgroundAudioUrl?: string;
  backgroundImageUrl: string;
  totalDurationInSeconds: number;
  events: BattleEventData[];
}

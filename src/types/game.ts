export type GameStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'gameover' | 'victory';

export type GameMode = 'arcade' | 'practice';

export type Theme = 'neon' | 'retro' | 'minimalist';

export type CameraMode = 'follow' | 'topDown';

export interface Coordinate {
  x: number;
  z: number;
}

export interface Direction {
  dx: number;
  dz: number;
}

export type GhostType = 'blinky' | 'pinky' | 'inky' | 'clyde';
export type GhostMode = 'chase' | 'scatter' | 'frightened' | 'respawn';

export interface GhostState {
  type: GhostType;
  gridX: number;
  gridZ: number;
  posX: number;
  posZ: number;
  direction: Direction;
  nextDirection: Direction;
  targetX: number;
  targetZ: number;
  mode: GhostMode;
  speed: number;
  progress: number; // 0 to 1 between cells
}

export interface PacmanState {
  gridX: number;
  gridZ: number;
  posX: number;
  posZ: number;
  direction: Direction;
  nextDirection: Direction;
  progress: number;
  speed: number;
  lastActiveDir: Direction;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  date: string;
}

export interface GameStats {
  gamesPlayed: number;
  totalScore: number;
  totalPelletsEaten: number;
  ghostsEatenCount: number;
  maxLevelReached: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number; // 1 to 0
  maxLife: number;
}

import { create } from 'zustand';
import type {
  GameStatus,
  GameMode,
  Theme,
  CameraMode,
  Direction,
  GhostType,
  GhostMode,
  GhostState,
  PacmanState,
  Achievement,
  GameStats,
  Particle,
} from '../types/game';
import {
  INITIAL_MAZE,
  MAZE_ROWS,
  MAZE_COLS,
  PACMAN_SPAWN_X,
  PACMAN_SPAWN_Z,
  GHOST_SPAWN_X,
  GHOST_SPAWN_Z,
  isValidMove,
} from '../utils/mazeGenerator';
import { getGhostTarget, getNextGhostDirection, isInsideGhostHouse } from '../utils/ghostAI';
import { audioSynth } from '../utils/audioSynth';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_waka', title: 'First Nibble', description: 'Eat your very first pellet', unlocked: false, icon: 'Cookie' },
  { id: 'ghost_buster', title: 'Ghost Buster', description: 'Eat a frightened ghost', unlocked: false, icon: 'Ghost' },
  { id: 'power_hungry', title: 'Power Hungry', description: 'Eat all 4 power pellets in a single level', unlocked: false, icon: 'Zap' },
  { id: 'level_clear', title: 'Level Clear', description: 'Complete your first level', unlocked: false, icon: 'Award' },
  { id: 'triple_digit', title: 'Triple Digit Combo', description: 'Reach a score of 10,000 points', unlocked: false, icon: 'TrendingUp' },
];

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  totalScore: 0,
  totalPelletsEaten: 0,
  ghostsEatenCount: 0,
  maxLevelReached: 1,
};

interface GameStore {
  // Game state
  gameStatus: GameStatus;
  gameMode: GameMode;
  score: number;
  highScore: number;
  level: number;
  lives: number;
  combo: number;
  theme: Theme;
  cameraMode: CameraMode;
  soundEnabled: boolean;
  volume: number;
  stats: GameStats;
  achievements: Achievement[];
  
  // Game map
  pellets: Record<string, boolean>; // key: "x,z", true = active
  powerPellets: Record<string, boolean>; // key: "x,z", true = active
  totalPelletCount: number;
  pelletsEatenThisLevel: number;
  
  // Entities
  pacman: PacmanState;
  ghosts: Record<GhostType, GhostState>;
  
  // Timers and systems
  powerPelletTimer: number; // in seconds
  scatterChaseTimer: number; // in seconds
  ghostModeCycle: number;
  currentGhostMode: GhostMode; // 'chase' | 'scatter'
  screenShake: number;
  particles: Particle[];
  
  // Actions
  setTheme: (theme: Theme) => void;
  setCameraMode: (mode: CameraMode) => void;
  setGameMode: (mode: GameMode) => void;
  toggleSound: () => void;
  setVolume: (volume: number) => void;
  initGame: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  setPacmanDirection: (dir: Direction) => void;
  tick: (delta: number) => void;
  unlockAchievement: (id: string) => void;
  triggerScreenShake: (intensity: number) => void;
  spawnParticles: (x: number, y: number, z: number, color: string, count: number) => void;
  advanceNextLevel: () => void;
}

// Initial Entity States
const createInitialPacman = (): PacmanState => ({
  gridX: PACMAN_SPAWN_X,
  gridZ: PACMAN_SPAWN_Z,
  posX: PACMAN_SPAWN_X,
  posZ: PACMAN_SPAWN_Z,
  direction: { dx: 0, dz: 0 },
  nextDirection: { dx: 0, dz: 0 },
  progress: 0,
  speed: 4.5, // Grid cells per second
  lastActiveDir: { dx: 0, dz: -1 }, // North by default
});

const createInitialGhost = (type: GhostType): GhostState => {
  let gridX = GHOST_SPAWN_X;
  let gridZ = GHOST_SPAWN_Z;
  
  // Offset start positions inside house
  if (type === 'blinky') {
    gridX = GHOST_SPAWN_X;
    gridZ = GHOST_SPAWN_Z - 1; // Blinky starts outside house, right above gate
  } else if (type === 'pinky') {
    gridX = GHOST_SPAWN_X;
    gridZ = GHOST_SPAWN_Z; // pinky center
  } else if (type === 'inky') {
    gridX = GHOST_SPAWN_X - 1;
    gridZ = GHOST_SPAWN_Z; // inky left
  } else if (type === 'clyde') {
    gridX = GHOST_SPAWN_X + 1;
    gridZ = GHOST_SPAWN_Z; // clyde right
  }

  return {
    type,
    gridX,
    gridZ,
    posX: gridX,
    posZ: gridZ,
    direction: type === 'blinky' ? { dx: -1, dz: 0 } : { dx: 0, dz: -1 },
    nextDirection: { dx: 0, dz: 0 },
    targetX: 0,
    targetZ: 0,
    mode: 'scatter',
    speed: 3.5, // Slightly slower than Pacman
    progress: 0,
  };
};

export const useGameStore = create<GameStore>((set, get) => {
  // Load initial settings from LocalStorage if available
  const savedHighScore = localStorage.getItem('pacman3d_highscore') 
    ? parseInt(localStorage.getItem('pacman3d_highscore') || '0', 10) 
    : 0;

  const savedStats = localStorage.getItem('pacman3d_stats')
    ? JSON.parse(localStorage.getItem('pacman3d_stats') || '{}')
    : DEFAULT_STATS;

  const savedAchievements = localStorage.getItem('pacman3d_achievements')
    ? JSON.parse(localStorage.getItem('pacman3d_achievements') || '[]')
    : DEFAULT_ACHIEVEMENTS;

  const parsePellets = () => {
    const pellets: Record<string, boolean> = {};
    const powerPellets: Record<string, boolean> = {};
    let count = 0;

    for (let z = 0; z < MAZE_ROWS; z++) {
      for (let x = 0; x < MAZE_COLS; x++) {
        if (INITIAL_MAZE[z][x] === 2) {
          pellets[`${x},${z}`] = true;
          count++;
        } else if (INITIAL_MAZE[z][x] === 3) {
          powerPellets[`${x},${z}`] = true;
          count++;
        }
      }
    }
    return { pellets, powerPellets, count };
  };

  return {
    // Config states
    gameStatus: 'idle',
    gameMode: 'arcade',
    score: 0,
    highScore: savedHighScore,
    level: 1,
    lives: 3,
    combo: 0,
    theme: 'neon',
    cameraMode: 'follow',
    soundEnabled: true,
    volume: 0.3,
    stats: savedStats,
    achievements: savedAchievements,

    // Map states
    pellets: {},
    powerPellets: {},
    totalPelletCount: 0,
    pelletsEatenThisLevel: 0,

    // Entities
    pacman: createInitialPacman(),
    ghosts: {
      blinky: createInitialGhost('blinky'),
      pinky: createInitialGhost('pinky'),
      inky: createInitialGhost('inky'),
      clyde: createInitialGhost('clyde'),
    },

    // Timers
    powerPelletTimer: 0,
    scatterChaseTimer: 7, // starts with scatter for 7 seconds
    ghostModeCycle: 0,
    currentGhostMode: 'scatter',
    screenShake: 0,
    particles: [],

    // Configuration Actions
    setTheme: (theme) => set({ theme }),
    setCameraMode: (cameraMode) => set({ cameraMode }),
    setGameMode: (gameMode) => set({ gameMode }),
    toggleSound: () => {
      const current = get().soundEnabled;
      set({ soundEnabled: !current });
      audioSynth.setMute(current);
    },
    setVolume: (volume) => {
      set({ volume });
      audioSynth.setVolume(volume);
    },

    // Game Actions
    initGame: () => {
      const { pellets, powerPellets, count } = parsePellets();
      set({
        score: 0,
        level: 1,
        lives: 3,
        combo: 0,
        gameStatus: 'ready',
        gameMode: get().gameMode || 'arcade',
        pellets,
        powerPellets,
        totalPelletCount: count,
        pelletsEatenThisLevel: 0,
        pacman: createInitialPacman(),
        ghosts: {
          blinky: createInitialGhost('blinky'),
          pinky: createInitialGhost('pinky'),
          inky: createInitialGhost('inky'),
          clyde: createInitialGhost('clyde'),
        },
        powerPelletTimer: 0,
        scatterChaseTimer: 7,
        ghostModeCycle: 0,
        currentGhostMode: 'scatter',
        particles: [],
      });
      audioSynth.init();
      audioSynth.setMute(!get().soundEnabled);
      audioSynth.setVolume(get().volume);
    },

    startGame: () => {
      const status = get().gameStatus;
      if (status === 'ready' || status === 'gameover' || status === 'victory') {
        if (status === 'gameover' || status === 'victory') {
          get().initGame();
        }
        set({ gameStatus: 'playing' });
        
        // Update stats
        const newStats = { ...get().stats, gamesPlayed: get().stats.gamesPlayed + 1 };
        set({ stats: newStats });
        localStorage.setItem('pacman3d_stats', JSON.stringify(newStats));
        
        audioSynth.playStartTheme();
        
        // Start siren after start theme plays (approx 2.4s delay)
        setTimeout(() => {
          if (get().gameStatus === 'playing') {
            audioSynth.startSiren(1.0 + get().level * 0.1);
          }
        }, 2500);
      }
    },

    pauseGame: () => {
      if (get().gameStatus === 'playing') {
        set({ gameStatus: 'paused' });
        audioSynth.stopSiren();
      }
    },

    resumeGame: () => {
      if (get().gameStatus === 'paused') {
        set({ gameStatus: 'playing' });
        audioSynth.startSiren(1.0 + get().level * 0.1);
      }
    },

    resetGame: () => {
      get().initGame();
      audioSynth.stopSiren();
    },

    setPacmanDirection: (dir: Direction) => {
      set((state) => {
        // If pacman is currently still, immediately try to apply the direction
        const pacman = state.pacman;
        const nextLastActiveDir = (dir.dx !== 0 || dir.dz !== 0) ? dir : pacman.lastActiveDir;
        if (pacman.direction.dx === 0 && pacman.direction.dz === 0) {
          if (isValidMove(pacman.gridX, pacman.gridZ, dir)) {
            return {
              pacman: {
                ...pacman,
                direction: dir,
                nextDirection: dir,
                lastActiveDir: nextLastActiveDir,
              },
            };
          }
        }
        return {
          pacman: {
            ...pacman,
            nextDirection: dir,
          },
        };
      });
    },

    unlockAchievement: (id: string) => {
      const achievements = get().achievements.map((ach) => {
        if (ach.id === id && !ach.unlocked) {
          return { ...ach, unlocked: true };
        }
        return ach;
      });
      set({ achievements });
      localStorage.setItem('pacman3d_achievements', JSON.stringify(achievements));
    },

    triggerScreenShake: (intensity: number) => {
      set({ screenShake: intensity });
    },

    spawnParticles: (x: number, y: number, z: number, color: string, count: number) => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        // Random velocity sphere projection
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 1.5 + Math.random() * 3.5;
        
        newParticles.push({
          id: Math.random() + Date.now(),
          x,
          y,
          z,
          vx: Math.sin(phi) * Math.cos(theta) * speed,
          vy: Math.sin(phi) * Math.sin(theta) * speed + 1.0, // bias upward
          vz: Math.cos(phi) * speed,
          color,
          size: 0.08 + Math.random() * 0.15,
          life: 1.0,
          maxLife: 0.5 + Math.random() * 0.8,
        });
      }
      set((state) => ({ particles: [...state.particles, ...newParticles] }));
    },

    advanceNextLevel: () => {
      const nextLvl = get().level + 1;
      const { pellets, powerPellets, count } = parsePellets();
      
      const pacman = createInitialPacman();
      pacman.speed = Math.min(7.0, 4.5 + nextLvl * 0.25);
      
      const ghosts = {
        blinky: createInitialGhost('blinky'),
        pinky: createInitialGhost('pinky'),
        inky: createInitialGhost('inky'),
        clyde: createInitialGhost('clyde'),
      };
      
      Object.keys(ghosts).forEach((k) => {
        ghosts[k as GhostType].speed = Math.min(6.5, 3.5 + nextLvl * 0.25);
      });

      set({
        level: nextLvl,
        gameStatus: 'playing',
        pellets,
        powerPellets,
        totalPelletCount: count,
        pelletsEatenThisLevel: 0,
        pacman,
        ghosts,
        powerPelletTimer: 0,
        scatterChaseTimer: 7,
        ghostModeCycle: 0,
        currentGhostMode: 'scatter',
        particles: [],
      });
      
      audioSynth.stopSiren();
      audioSynth.playStartTheme();
      setTimeout(() => {
        if (get().gameStatus === 'playing') {
          audioSynth.startSiren(1.0 + nextLvl * 0.1);
        }
      }, 2500);
    },

    // Game loop tick
    tick: (delta: number) => {
      const { gameStatus } = get();
      if (gameStatus !== 'playing') {
        // Still update particles even if paused/idle
        if (get().particles.length > 0) {
          set((state) => ({
            particles: state.particles
              .map((p) => {
                const newLife = p.life - delta / p.maxLife;
                return {
                  ...p,
                  x: p.x + p.vx * delta,
                  y: p.y + p.vy * delta - 4.9 * delta * delta, // gravity
                  z: p.z + p.vz * delta,
                  life: newLife,
                };
              })
              .filter((p) => p.life > 0),
          }));
        }
        return;
      }

      const state = get();
      let scoreToAdd = 0;
      let pelletsEatenCount = 0;
      let nextStatus: GameStatus = gameStatus;
      let nextLives = state.lives;
      let nextLevel = state.level;
      let nextPowerTimer = Math.max(0, state.powerPelletTimer - delta);
      let nextScatterTimer = state.scatterChaseTimer;
      let nextMode = state.currentGhostMode;
      let nextModeCycle = state.ghostModeCycle;
      let shake = Math.max(0, state.screenShake - delta * 4);

      // --- TIMER AND MODES STATE MACHINE ---
      if (nextPowerTimer > 0) {
        // Frightened mode timer running
        if (nextPowerTimer === 0) {
          // power pellet finished, restore ghost modes
          set({ combo: 0 });
        }
      } else {
        // Normal chase / scatter cycle
        nextScatterTimer -= delta;
        if (nextScatterTimer <= 0) {
          nextModeCycle++;
          // Classic schedule: Scatter 7s, Chase 20s, Scatter 7s, Chase 20s, Scatter 5s...
          if (nextMode === 'scatter') {
            nextMode = 'chase';
            nextScatterTimer = 20; // Chase duration
          } else {
            nextMode = 'scatter';
            nextScatterTimer = nextModeCycle > 4 ? 5 : 7; // Scatter duration gets shorter
          }
        }
      }

      // --- PACMAN UPDATE ---
      const pacman = { ...state.pacman };
      pacman.progress += delta * pacman.speed;
      
      if (pacman.progress >= 1) {
        // Snap grid location
        pacman.gridX = ((pacman.gridX + pacman.direction.dx) % MAZE_COLS + MAZE_COLS) % MAZE_COLS;
        pacman.gridZ = pacman.gridZ + pacman.direction.dz;
        pacman.progress = 0;

        // Check tunnel wrapping
        if (pacman.gridX === 0 && pacman.direction.dx === -1) {
          pacman.gridX = MAZE_COLS - 1;
        } else if (pacman.gridX === MAZE_COLS - 1 && pacman.direction.dx === 1) {
          pacman.gridX = 0;
        }

        // Apply queued direction changes at intersections/grid boundaries
        if (pacman.nextDirection.dx !== 0 || pacman.nextDirection.dz !== 0) {
          if (isValidMove(pacman.gridX, pacman.gridZ, pacman.nextDirection)) {
            pacman.direction = pacman.nextDirection;
            pacman.lastActiveDir = pacman.direction;
          }
        }

        // Check if movement in current direction is blocked
        if (!isValidMove(pacman.gridX, pacman.gridZ, pacman.direction)) {
          pacman.direction = { dx: 0, dz: 0 };
        }
      }

      // Smooth position interpolation
      const pacOffsetX = (MAZE_COLS - 1) / 2;
      const pacOffsetZ = (MAZE_ROWS - 1) / 2;
      const curX = pacman.gridX - pacOffsetX;
      const curZ = pacman.gridZ - pacOffsetZ;
      
      let targetX = curX + pacman.direction.dx;
      let targetZ = curZ + pacman.direction.dz;

      // Handle wrapping in visual interpolation
      if (pacman.gridX === MAZE_COLS - 1 && pacman.direction.dx === 1) {
        targetX = -pacOffsetX - 1;
      } else if (pacman.gridX === 0 && pacman.direction.dx === -1) {
        targetX = pacOffsetX + 1;
      }

      pacman.posX = curX + (targetX - curX) * pacman.progress;
      pacman.posZ = curZ + (targetZ - curZ) * pacman.progress;

      // --- EAT PELLETS CHECK ---
      const coordKey = `${pacman.gridX},${pacman.gridZ}`;
      const updatedPellets = { ...state.pellets };
      const updatedPowerPellets = { ...state.powerPellets };
      let newPelletsEatenThisLevel = state.pelletsEatenThisLevel;

      if (updatedPellets[coordKey]) {
        delete updatedPellets[coordKey];
        scoreToAdd += 10;
        pelletsEatenCount++;
        newPelletsEatenThisLevel++;
        get().unlockAchievement('first_waka');
        
        if (nextPowerTimer > 0) {
          audioSynth.playPowerWaka();
        } else {
          audioSynth.playWaka();
        }
      } else if (updatedPowerPellets[coordKey]) {
        delete updatedPowerPellets[coordKey];
        scoreToAdd += 50;
        pelletsEatenCount++;
        newPelletsEatenThisLevel++;
        
        // Go to frightened mode
        nextPowerTimer = Math.max(5, 8 - nextLevel * 0.5); // power pellet duration shrinks with level
        set({ combo: 0 }); // Reset ghost combo
        audioSynth.playEatGhost(); // eat power pellet chime
        
        // Check power pellet achievement
        let activePowerPelletCount = 0;
        for (const k in updatedPowerPellets) {
          if (updatedPowerPellets[k]) activePowerPelletCount++;
        }
        if (activePowerPelletCount === 0) {
          get().unlockAchievement('power_hungry');
        }
      }

      // Level Complete check
      if (newPelletsEatenThisLevel === state.totalPelletCount && state.totalPelletCount > 0) {
        nextStatus = 'victory';
        audioSynth.stopSiren();
        audioSynth.playVictory();
        get().unlockAchievement('level_clear');
        
        // Update stats
        const newStats = {
          ...state.stats,
          totalScore: state.stats.totalScore + state.score + scoreToAdd,
          totalPelletsEaten: state.stats.totalPelletsEaten + newPelletsEatenThisLevel,
          maxLevelReached: Math.max(state.stats.maxLevelReached, state.level),
        };
        set({ stats: newStats });
        localStorage.setItem('pacman3d_stats', JSON.stringify(newStats));
      }

      // --- GHOSTS & COLLISIONS UPDATE (Arcade Mode Only) ---
      const updatedGhosts = { ...state.ghosts };
      let nextCombo = state.combo;

      if (state.gameMode === 'arcade') {
        const ghostList = Object.keys(updatedGhosts) as GhostType[];

        ghostList.forEach((type) => {
          const ghost = { ...updatedGhosts[type] };
          
          // Update speed based on state
          let speed = 3.5 + nextLevel * 0.2;
          let ghostMode: GhostMode = nextPowerTimer > 0 ? 'frightened' : nextMode;

          // If ghost is returning home
          if (ghost.mode === 'respawn') {
            ghostMode = 'respawn';
            speed = 9.0; // Eyes move super fast!
          } else if (ghostMode === 'frightened') {
            speed = 2.0; // Frightened is slow
          }

          ghost.speed = speed;
          ghost.progress += delta * ghost.speed;

          if (ghost.progress >= 1) {
            // Snap grid
            ghost.gridX = ((ghost.gridX + ghost.direction.dx) % MAZE_COLS + MAZE_COLS) % MAZE_COLS;
            ghost.gridZ = ghost.gridZ + ghost.direction.dz;
            ghost.progress = 0;

            // Wrap around check
            if (ghost.gridX === 0 && ghost.direction.dx === -1) {
              ghost.gridX = MAZE_COLS - 1;
            } else if (ghost.gridX === MAZE_COLS - 1 && ghost.direction.dx === 1) {
              ghost.gridX = 0;
            }

            // If respawn mode reached target house spawn, exit respawn
            if (ghost.mode === 'respawn' && ghost.gridX === GHOST_SPAWN_X && ghost.gridZ === GHOST_SPAWN_Z) {
              ghost.mode = nextPowerTimer > 0 ? 'frightened' : nextMode;
            }

            // Force release from ghost house logic
            if (isInsideGhostHouse(ghost.gridX, ghost.gridZ) && ghost.mode !== 'respawn') {
              ghost.direction = { dx: 0, dz: -1 };
            } else {
              // Standard AI navigation
              const target = getGhostTarget(
                type,
                ghostMode,
                pacman.gridX,
                pacman.gridZ,
                pacman.direction,
                updatedGhosts.blinky.gridX,
                updatedGhosts.blinky.gridZ,
                ghost.gridX,
                ghost.gridZ
              );
              ghost.targetX = target.x;
              ghost.targetZ = target.z;

              // Compute next grid direction
              ghost.direction = getNextGhostDirection(
                type,
                ghostMode,
                ghost.gridX,
                ghost.gridZ,
                ghost.direction,
                target
              );
            }
          }

          // Interpolate visual positions
          const curGX = ghost.gridX - pacOffsetX;
          const curGZ = ghost.gridZ - pacOffsetZ;
          
          let tarX = curGX + ghost.direction.dx;
          let tarZ = curGZ + ghost.direction.dz;

          // Wrap visualization
          if (ghost.gridX === MAZE_COLS - 1 && ghost.direction.dx === 1) {
            tarX = -pacOffsetX - 1;
          } else if (ghost.gridX === 0 && ghost.direction.dx === -1) {
            tarX = pacOffsetX + 1;
          }

          ghost.posX = curGX + (tarX - curGX) * ghost.progress;
          ghost.posZ = curGZ + (tarZ - curGZ) * ghost.progress;
          ghost.mode = ghostMode;

          updatedGhosts[type] = ghost;
        });

        // --- COLLISION RESOLUTION ---
        ghostList.forEach((type) => {
          const ghost = updatedGhosts[type];
          
          const dx = pacman.posX - ghost.posX;
          const dz = pacman.posZ - ghost.posZ;
          const distSq = dx * dx + dz * dz;
          const collisionThresholdSq = 0.5 * 0.5;

          if (distSq < collisionThresholdSq) {
            if (ghost.mode === 'frightened') {
              audioSynth.playEatGhost();
              get().spawnParticles(ghost.posX, 0.2, ghost.posZ, '#00D4FF', 25);
              get().triggerScreenShake(0.35);
              
              ghost.mode = 'respawn';
              ghost.gridX = GHOST_SPAWN_X;
              ghost.gridZ = GHOST_SPAWN_Z;
              ghost.posX = GHOST_SPAWN_X - pacOffsetX;
              ghost.posZ = GHOST_SPAWN_Z - pacOffsetZ;
              ghost.progress = 0;
              ghost.direction = { dx: 0, dz: -1 };

              nextCombo++;
              scoreToAdd += 200 * Math.pow(2, nextCombo - 1);
              
              get().unlockAchievement('ghost_buster');
            } else if (ghost.mode !== 'respawn') {
              nextStatus = 'ready';
              nextLives = state.lives - 1;
              
              audioSynth.playDeath();
              get().spawnParticles(pacman.posX, 0.2, pacman.posZ, '#FFD700', 40);
              get().triggerScreenShake(0.8);

              if (nextLives <= 0) {
                nextStatus = 'gameover';
                audioSynth.stopSiren();
                
                const finalScore = state.score + scoreToAdd;
                let finalHighScore = state.highScore;
                if (finalScore > finalHighScore) {
                  finalHighScore = finalScore;
                  localStorage.setItem('pacman3d_highscore', finalHighScore.toString());
                }

                const newStats = {
                  ...state.stats,
                  totalScore: state.stats.totalScore + finalScore,
                  totalPelletsEaten: state.stats.totalPelletsEaten + state.pelletsEatenThisLevel + pelletsEatenCount,
                  ghostsEatenCount: state.stats.ghostsEatenCount + state.stats.ghostsEatenCount,
                  maxLevelReached: Math.max(state.stats.maxLevelReached, state.level),
                };

                set({ 
                  highScore: finalHighScore,
                  stats: newStats
                });
                localStorage.setItem('pacman3d_stats', JSON.stringify(newStats));
              } else {
                pacman.gridX = PACMAN_SPAWN_X;
                pacman.gridZ = PACMAN_SPAWN_Z;
                pacman.posX = PACMAN_SPAWN_X - pacOffsetX;
                pacman.posZ = PACMAN_SPAWN_Z - pacOffsetZ;
                pacman.progress = 0;
                pacman.direction = { dx: 0, dz: 0 };
                pacman.nextDirection = { dx: 0, dz: 0 };
                pacman.lastActiveDir = { dx: 0, dz: -1 };

                const gList = Object.keys(updatedGhosts) as GhostType[];
                gList.forEach((gt) => {
                  updatedGhosts[gt] = createInitialGhost(gt);
                });
                
                nextPowerTimer = 0;
                nextScatterTimer = 7;
                nextModeCycle = 0;
                nextMode = 'scatter';
                
                audioSynth.stopSiren();
                setTimeout(() => {
                  if (get().gameStatus === 'playing') {
                    audioSynth.startSiren(1.0 + get().level * 0.1);
                  }
                }, 2000);
              }
            }
          }
        });
      }

      // --- SCORE AND UPDATE STATE ---
      const nextScore = state.score + scoreToAdd;
      if (nextScore >= 10000) {
        get().unlockAchievement('triple_digit');
      }

      // Particles physics tick
      let updatedParticles = state.particles;
      if (updatedParticles.length > 0) {
        updatedParticles = updatedParticles
          .map((p) => {
            const newLife = p.life - delta / p.maxLife;
            return {
              ...p,
              x: p.x + p.vx * delta,
              y: p.y + p.vy * delta - 4.9 * delta * delta,
              z: p.z + p.vz * delta,
              life: newLife,
            };
          })
          .filter((p) => p.life > 0);
      }

      set({
        score: nextScore,
        lives: nextLives,
        gameStatus: nextStatus,
        powerPelletTimer: nextPowerTimer,
        scatterChaseTimer: nextScatterTimer,
        currentGhostMode: nextMode,
        ghostModeCycle: nextModeCycle,
        pacman,
        ghosts: updatedGhosts,
        pellets: updatedPellets,
        powerPellets: updatedPowerPellets,
        pelletsEatenThisLevel: newPelletsEatenThisLevel,
        combo: nextCombo,
        screenShake: shake,
        particles: updatedParticles,
      });
    },
  };
});

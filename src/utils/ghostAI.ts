import type { Direction, GhostType, GhostMode, Coordinate } from '../types/game';
import {
  MAZE_COLS,
  GHOST_SPAWN_X,
  GHOST_SPAWN_Z,
  getAvailableDirections,
} from './mazeGenerator';

// Target tiles for Scatter Mode
const SCATTER_TARGETS: Record<GhostType, Coordinate> = {
  blinky: { x: 18, z: 0 },   // Top-Right corner
  pinky: { x: 0, z: 0 },     // Top-Left corner
  inky: { x: 18, z: 20 },    // Bottom-Right corner
  clyde: { x: 0, z: 20 },    // Bottom-Left corner
};

// Euclidean distance squared between two points
const getDistanceSq = (x1: number, z1: number, x2: number, z2: number): number => {
  const dx = x1 - x2;
  const dz = z1 - z2;
  return dx * dx + dz * dz;
};

// Calculate the target grid cell based on ghost type and game state
export const getGhostTarget = (
  type: GhostType,
  mode: GhostMode,
  pacmanGridX: number,
  pacmanGridZ: number,
  pacmanDir: Direction,
  blinkyGridX: number,
  blinkyGridZ: number,
  ghostGridX: number,
  ghostGridZ: number
): Coordinate => {
  // 1. Respawn Mode: head back to the ghost house spawner
  if (mode === 'respawn') {
    return { x: GHOST_SPAWN_X, z: GHOST_SPAWN_Z - 1 }; // Target just above the house gate
  }

  // 2. Frightened Mode: target is pseudo-random, return current position to force random walk
  if (mode === 'frightened') {
    return { x: pacmanGridX, z: pacmanGridZ }; // Not strictly used for pathfinding as it walks randomly
  }

  // 3. Scatter Mode: go to home corner
  if (mode === 'scatter') {
    return SCATTER_TARGETS[type];
  }

  // 4. Chase Mode (Original Arcade Logic)
  switch (type) {
    case 'blinky':
      // Target Pacman directly
      return { x: pacmanGridX, z: pacmanGridZ };

    case 'pinky':
      // Target 4 tiles ahead of Pacman
      // Classic Pacman bug: if facing UP, Pinky targets 4 cells UP and 4 cells LEFT
      const pOffsetX = pacmanDir.dx * 4;
      const pOffsetZ = pacmanDir.dz * 4;
      const bugX = pacmanDir.dz === -1 ? -4 : 0; // if facing UP (dz === -1), add left shift
      return {
        x: pacmanGridX + pOffsetX + bugX,
        z: pacmanGridZ + pOffsetZ,
      };

    case 'inky': {
      // Inky targets based on Blinky's position and 2 tiles in front of Pacman.
      // Vector = (2 tiles ahead of Pacman) - Blinky
      // Target = (2 tiles ahead of Pacman) + Vector
      const p2AheadX = pacmanGridX + pacmanDir.dx * 2;
      const p2AheadZ = pacmanGridZ + pacmanDir.dz * 2;
      
      const vecX = p2AheadX - blinkyGridX;
      const vecZ = p2AheadZ - blinkyGridZ;
      
      return {
        x: p2AheadX + vecX,
        z: p2AheadZ + vecZ,
      };
    }

    case 'clyde': {
      // If Clyde is >= 8 tiles away from Pacman, target Pacman.
      // Otherwise, head to his scatter corner (bottom-left).
      const distSq = getDistanceSq(ghostGridX, ghostGridZ, pacmanGridX, pacmanGridZ);
      const thresholdSq = 8 * 8; // 64
      if (distSq >= thresholdSq) {
        return { x: pacmanGridX, z: pacmanGridZ };
      } else {
        return SCATTER_TARGETS.clyde;
      }
    }

    default:
      return { x: pacmanGridX, z: pacmanGridZ };
  }
};

// Determine the next move direction for a ghost
export const getNextGhostDirection = (
  _type: GhostType,
  mode: GhostMode,
  currentGridX: number,
  currentGridZ: number,
  currentDir: Direction,
  target: Coordinate
): Direction => {
  // Get all valid moves, excluding the reverse of current direction
  // Ghosts cannot reverse direction under normal pathfinding
  const validDirs = getAvailableDirections(currentGridX, currentGridZ, true, currentDir);

  // If there are no valid moves (should not happen with open maze), go reverse
  if (validDirs.length === 0) {
    return { dx: -currentDir.dx, dz: -currentDir.dz };
  }

  // Frightened mode choice is purely random
  if (mode === 'frightened') {
    const randomIndex = Math.floor(Math.random() * validDirs.length);
    return validDirs[randomIndex];
  }

  // Under normal modes or respawn, choose the direction that minimizes distance to the target
  let bestDir = validDirs[0];
  let minDistance = Infinity;

  // Classic tie-breaker order: UP (dz = -1), LEFT (dx = -1), DOWN (dz = 1), RIGHT (dx = 1)
  const getDirPriority = (dir: Direction) => {
    if (dir.dz === -1) return 0; // UP
    if (dir.dx === -1) return 1; // LEFT
    if (dir.dz === 1) return 2;  // DOWN
    return 3;                    // RIGHT (dx = 1)
  };

  // Sort valid directions to ensure tie-breaker order is preserved
  validDirs.sort((a, b) => getDirPriority(a) - getDirPriority(b));

  for (const dir of validDirs) {
    const nextX = currentGridX + dir.dx;
    const nextZ = currentGridZ + dir.dz;
    
    // Normalized wrap-around coordinate
    const normalizedNextX = ((nextX % MAZE_COLS) + MAZE_COLS) % MAZE_COLS;
    
    const distSq = getDistanceSq(normalizedNextX, nextZ, target.x, target.z);
    if (distSq < minDistance) {
      minDistance = distSq;
      bestDir = dir;
    }
  }

  return bestDir;
};

// Check if a ghost is inside the Ghost House grid boundaries
export const isInsideGhostHouse = (gridX: number, gridZ: number): boolean => {
  return gridX >= 7 && gridX <= 11 && gridZ >= 9 && gridZ <= 11;
};

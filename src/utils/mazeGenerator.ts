import type { Direction } from '../types/game';

// 1 = Wall
// 2 = Standard Pellet
// 3 = Power Pellet
// 4 = Ghost House (starting position/respawn zone)
// 5 = Ghost House Gate (only ghosts can traverse, Pacman cannot)
// 0 = Empty Path
export const INITIAL_MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 3, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 5, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 4, 4, 4, 1, 0, 0, 2, 0, 0, 0, 0], // Tunnel row with ghost house
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
  [1, 3, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 3, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAZE_ROWS = INITIAL_MAZE.length;
export const MAZE_COLS = INITIAL_MAZE[0].length;

// Ghost House dimensions and coords
export const GHOST_HOUSE_GRID_X_RANGE = [7, 11];
export const GHOST_HOUSE_GRID_Z_RANGE = [9, 11];
export const GHOST_SPAWN_X = 9;
export const GHOST_SPAWN_Z = 10;
export const PACMAN_SPAWN_X = 9;
export const PACMAN_SPAWN_Z = 16; // bottom empty path

export const isWall = (gridX: number, gridZ: number): boolean => {
  // Wrap around boundaries
  const normalizedX = ((gridX % MAZE_COLS) + MAZE_COLS) % MAZE_COLS;
  if (gridZ < 0 || gridZ >= MAZE_ROWS) return true;
  return INITIAL_MAZE[gridZ][normalizedX] === 1;
};

export const isGhostGate = (gridX: number, gridZ: number): boolean => {
  const normalizedX = ((gridX % MAZE_COLS) + MAZE_COLS) % MAZE_COLS;
  if (gridZ < 0 || gridZ >= MAZE_ROWS) return false;
  return INITIAL_MAZE[gridZ][normalizedX] === 5;
};

export const isValidMove = (gridX: number, gridZ: number, dir: Direction, isGhost = false): boolean => {
  const nextX = gridX + dir.dx;
  const nextZ = gridZ + dir.dz;
  
  const normalizedX = ((nextX % MAZE_COLS) + MAZE_COLS) % MAZE_COLS;
  
  if (nextZ < 0 || nextZ >= MAZE_ROWS) return false;
  
  const cell = INITIAL_MAZE[nextZ][normalizedX];
  
  // Wall is blocked for everyone
  if (cell === 1) return false;
  
  // Gate is blocked for Pacman, allowed for Ghost
  if (cell === 5 && !isGhost) return false;
  
  return true;
};

// Returns possible directions from a coordinate, excluding reversing current direction (optional)
export const getAvailableDirections = (
  gridX: number,
  gridZ: number,
  isGhost = false,
  excludeDir?: Direction
): Direction[] => {
  const dirs: Direction[] = [
    { dx: 0, dz: -1 }, // UP
    { dx: 0, dz: 1 },  // DOWN
    { dx: -1, dz: 0 }, // LEFT
    { dx: 1, dz: 0 },  // RIGHT
  ];

  return dirs.filter((dir) => {
    // Exclude reverse direction
    if (excludeDir && dir.dx === -excludeDir.dx && dir.dz === -excludeDir.dz) {
      return false;
    }
    return isValidMove(gridX, gridZ, dir, isGhost);
  });
};

// Check if a coordinate is an intersection (more than 2 options, or 2 options if one is not reverse)
export const isIntersection = (gridX: number, gridZ: number, isGhost = false): boolean => {
  const options = getAvailableDirections(gridX, gridZ, isGhost);
  return options.length > 2;
};

// Map coordinates to 3D world space (centered grid)
export const gridToWorld = (gridX: number, gridZ: number) => {
  const offsetX = (MAZE_COLS - 1) / 2;
  const offsetZ = (MAZE_ROWS - 1) / 2;
  return {
    x: gridX - offsetX,
    y: 0,
    z: gridZ - offsetZ,
  };
};

export const worldToGrid = (x: number, z: number) => {
  const offsetX = (MAZE_COLS - 1) / 2;
  const offsetZ = (MAZE_ROWS - 1) / 2;
  return {
    gridX: Math.round(x + offsetX),
    gridZ: Math.round(z + offsetZ),
  };
};

import type { Direction } from '../types/game';

/**
 * Calculates the next direction vector based on the player's input
 * relative to Pacman's current facing direction.
 * 
 * @param input The direction input pressed by the player ('up' | 'down' | 'left' | 'right')
 * @param currentDir Pacman's current grid direction vector
 * @param isRelative Whether camera-relative (Pacman-relative) controls are active
 */
export const getMappedDirection = (
  input: 'up' | 'down' | 'left' | 'right',
  currentDir: Direction,
  isRelative: boolean
): Direction => {
  // If controls are not relative (e.g. top-down camera view), or Pacman is stationary,
  // map inputs directly to absolute grid coordinate directions.
  if (!isRelative || (currentDir.dx === 0 && currentDir.dz === 0)) {
    switch (input) {
      case 'up': return { dx: 0, dz: -1 };
      case 'down': return { dx: 0, dz: 1 };
      case 'left': return { dx: -1, dz: 0 };
      case 'right': return { dx: 1, dz: 0 };
    }
  }

  // Camera-relative inputs (Tank / 3rd-person follow controls)
  switch (input) {
    case 'up':
      // Continue forward
      return currentDir;
    case 'down':
      // Reverse direction (180 deg)
      return { dx: -currentDir.dx, dz: -currentDir.dz };
    case 'left':
      // Turn 90 deg counter-clockwise: (dx, dz) -> (dz, -dx)
      return { dx: currentDir.dz, dz: -currentDir.dx };
    case 'right':
      // Turn 90 deg clockwise: (dx, dz) -> (-dz, dx)
      return { dx: -currentDir.dz, dz: currentDir.dx };
  }
};
export default getMappedDirection;

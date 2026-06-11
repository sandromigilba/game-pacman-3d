import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getMappedDirection } from '../utils/controlHelper';

export const useKeyboardControls = () => {
  const setPacmanDirection = useGameStore((state) => state.setPacmanDirection);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const pauseGame = useGameStore((state) => state.pauseGame);
  const resumeGame = useGameStore((state) => state.resumeGame);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const pacman = useGameStore((state) => state.pacman);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows and space when playing
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) &&
        gameStatus === 'playing'
      ) {
        e.preventDefault();
      }

      let inputType: 'up' | 'down' | 'left' | 'right' | null = null;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          inputType = 'up';
          break;
        case 's':
        case 'arrowdown':
          inputType = 'down';
          break;
        case 'a':
        case 'arrowleft':
          inputType = 'left';
          break;
        case 'd':
        case 'arrowright':
          inputType = 'right';
          break;
        case ' ': // Spacebar to Pause
          if (gameStatus === 'playing') {
            pauseGame();
          } else if (gameStatus === 'paused') {
            resumeGame();
          }
          break;
        default:
          return;
      }

      if (inputType && gameStatus === 'playing') {
        const isRelative = cameraMode === 'follow';
        const newDir = getMappedDirection(inputType, pacman.lastActiveDir, isRelative);
        setPacmanDirection(newDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStatus, setPacmanDirection, pauseGame, resumeGame, cameraMode, pacman]);
};
export default useKeyboardControls;

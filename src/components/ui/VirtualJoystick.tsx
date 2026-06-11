import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getMappedDirection } from '../../utils/controlHelper';

export const VirtualJoystick: React.FC = () => {
  const [touchActive, setTouchActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef({ x: 0, y: 0 });
  
  const setPacmanDirection = useGameStore((state) => state.setPacmanDirection);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const cameraMode = useGameStore((state) => state.cameraMode);
  const pacman = useGameStore((state) => state.pacman);

  useEffect(() => {
    // Reset position when touch becomes inactive
    if (!touchActive) {
      setStickPos({ x: 0, y: 0 });
    }
  }, [touchActive]);

  if (gameStatus !== 'playing') return null;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchActive) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    
    // Max movement radius in pixels
    const maxRadius = 45;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    let targetX = dx;
    let targetY = dy;
    
    if (distance > maxRadius) {
      targetX = (dx / distance) * maxRadius;
      targetY = (dy / distance) * maxRadius;
    }
    
    setStickPos({ x: targetX, y: targetY });

    // Determine swipe direction with threshold
    const threshold = 18;
    if (distance > threshold) {
      let inputType: 'up' | 'down' | 'left' | 'right' | null = null;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        inputType = dx > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        inputType = dy > 0 ? 'down' : 'up';
      }

      if (inputType) {
        const isRelative = cameraMode === 'follow';
        const newDir = getMappedDirection(inputType, pacman.lastActiveDir, isRelative);
        setPacmanDirection(newDir);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center lg:hidden">
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl relative select-none joystick-container"
      >
        {/* Joystick outer ring guide */}
        <div className="absolute inset-2 border border-white/5 rounded-full pointer-events-none" />
        
        {/* Direction arrows overlay */}
        <div className="absolute text-white/20 text-[10px] top-1 pointer-events-none">▲</div>
        <div className="absolute text-white/20 text-[10px] bottom-1 pointer-events-none">▼</div>
        <div className="absolute text-white/20 text-[10px] left-2 pointer-events-none">◀</div>
        <div className="absolute text-white/20 text-[10px] right-2 pointer-events-none">▶</div>

        {/* Joystick handle */}
        <div
          style={{
            transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
          }}
          className={`w-12 h-12 rounded-full border shadow-xl flex items-center justify-center joystick-handle pointer-events-none ${
            touchActive
              ? 'bg-secondary border-secondary shadow-[0_0_15px_rgba(0,212,255,0.4)] scale-95'
              : 'bg-white/10 border-white/20'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
};
export default VirtualJoystick;

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Heart, Trophy, Zap } from 'lucide-react';
import Card from '../ui/Card';

export const Header: React.FC = () => {
  const { score, highScore, level, lives, powerPelletTimer, gameMode } = useGameStore();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-4 relative z-40 select-none">
      <Card className="px-6 py-4 flex flex-row items-center justify-between">
        
        {/* Game Title Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.5)] animate-pulse">
            <span className="text-[#050816] font-black text-lg select-none">C</span>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <h1 className="text-sm font-black tracking-wider text-white m-0 leading-none uppercase">
              PACMAN <span className="text-secondary font-medium">3D</span>
            </h1>
            <span className="text-[9px] text-muted-text font-semibold uppercase tracking-widest mt-0.5">
              Cyber Arcade
            </span>
          </div>
        </div>

        {/* Level Indicator */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-muted-text uppercase font-bold tracking-widest leading-none">
            {gameMode === 'practice' ? 'Practice' : 'Level'}
          </div>
          <div className="text-xl font-black text-white leading-none mt-1 select-all">
            {gameMode === 'practice' ? '∞' : level}
          </div>
        </div>

        {/* Current Score Panel */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-muted-text uppercase font-bold tracking-widest leading-none">
            Score
          </div>
          <div className={`text-2xl font-black leading-none mt-1 select-all transition-colors duration-300 ${
            powerPelletTimer > 0 ? 'text-primary neon-text-yellow' : 'text-white'
          }`}>
            {score.toLocaleString()}
          </div>
        </div>

        {/* High Score Panel */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/5 rounded-[20px] px-3 py-1.5">
          <Trophy size={14} className="text-primary" />
          <div className="flex flex-col text-left leading-none">
            <span className="text-[8px] text-muted-text uppercase font-semibold">High Score</span>
            <span className="text-xs font-bold text-white mt-0.5">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Combo Multiplier Alert (when frightened active) */}
        {powerPelletTimer > 0 && (
          <div className="flex items-center gap-1.5 bg-secondary/15 border border-secondary/30 rounded-[20px] px-3 py-1.5 animate-pulse">
            <Zap size={13} className="text-secondary" />
            <span className="text-[9px] text-secondary font-black uppercase tracking-wider">
              Power Mode: {Math.ceil(powerPelletTimer)}s
            </span>
          </div>
        )}

        {/* Lives counter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-text uppercase font-bold tracking-widest hidden sm:inline mr-1">
            Lives
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={18}
                className={`transition-all duration-300 ${
                  i < lives
                    ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                    : 'text-white/20 fill-transparent scale-90'
                }`}
              />
            ))}
          </div>
        </div>

      </Card>
    </div>
  );
};
export default Header;

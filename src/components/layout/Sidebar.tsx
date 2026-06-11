import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  Volume2,
  VolumeX,
  Keyboard,
  Award,
  BarChart2,
  Palette,
  Pause,
  RotateCcw,
  Play,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

// Icon mapper helper
const IconMap: Record<string, React.ReactNode> = {
  Cookie: <span className="text-amber-400">🍪</span>,
  Ghost: <span className="text-red-400">👻</span>,
  Zap: <span className="text-yellow-400">⚡</span>,
  Award: <span className="text-purple-400">🏆</span>,
  TrendingUp: <span className="text-green-400">📈</span>,
};

export const Sidebar: React.FC = () => {
  const {
    gameStatus,
    theme,
    soundEnabled,
    volume,
    stats,
    achievements,
    setTheme,
    toggleSound,
    setVolume,
    pauseGame,
    resumeGame,
    resetGame,
  } = useGameStore();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
  };

  return (
    <Card className="w-full xl:w-80 h-full p-6 flex flex-col justify-between gap-6 overflow-y-auto no-scrollbar relative z-40 select-none">
      
      {/* 1. SESSION MANAGEMENT */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
          <Palette size={12} />
          Controls & Session
        </h3>
        
        {/* Play/Pause/Restart buttons */}
        <div className="grid grid-cols-2 gap-3">
          {gameStatus === 'playing' ? (
            <Button variant="glass" size="sm" onClick={pauseGame} className="flex gap-2 text-xs">
              <Pause size={14} /> Pause
            </Button>
          ) : gameStatus === 'paused' ? (
            <Button variant="secondary" size="sm" onClick={resumeGame} className="flex gap-2 text-xs">
              <Play size={14} /> Resume
            </Button>
          ) : (
            <Button variant="glass" size="sm" disabled className="flex gap-2 text-xs opacity-50">
              <Pause size={14} /> Pause
            </Button>
          )}

          <Button variant="danger" size="sm" onClick={resetGame} className="flex gap-2 text-xs">
            <RotateCcw size={14} /> Reset
          </Button>
        </div>

        {/* Volume & Audio Settings */}
        <div className="flex flex-col gap-2 bg-white/5 rounded-[20px] p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Audio System</span>
            <button
              onClick={toggleSound}
              className="text-white hover:text-secondary transition-colors cursor-pointer rounded-full p-1 hover:bg-white/5"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-red-400" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <VolumeX size={12} className="text-muted-text" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!soundEnabled}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary disabled:opacity-50"
            />
            <Volume2 size={12} className="text-muted-text" />
          </div>
        </div>
      </div>

      {/* 2. THEME SWAPPER */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
          <Palette size={12} />
          Visual Skins
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {(['neon', 'retro', 'minimalist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={`py-2 px-1 text-[10px] font-bold uppercase tracking-wider rounded-[15px] border transition-all cursor-pointer ${
                theme === t
                  ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_10px_rgba(0,212,255,0.15)]'
                  : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ACHIEVEMENTS SYSTEM */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
        <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
          <Award size={12} />
          Achievements
        </h3>
        <div className="flex flex-col gap-2 max-h-[170px] xl:max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-center gap-3 p-2.5 rounded-[20px] border transition-all duration-300 ${
                ach.unlocked
                  ? 'bg-secondary/5 border-secondary/20 shadow-[0_0_10px_rgba(0,212,255,0.05)]'
                  : 'bg-white/2 border-white/5 opacity-55'
              }`}
            >
              <div className="text-xl flex-shrink-0 bg-white/5 p-1.5 rounded-[12px]">
                {IconMap[ach.icon] || '🎯'}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className={`text-xs font-bold ${ach.unlocked ? 'text-white' : 'text-muted-text'}`}>
                  {ach.title}
                </span>
                <span className="text-[9px] text-muted-text mt-0.5">{ach.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. STATISTICS DASHBOARD */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
          <BarChart2 size={12} />
          Lifetime Stats
        </h3>
        <div className="grid grid-cols-2 gap-2 text-left bg-white/3 rounded-[20px] p-3 border border-white/5 text-[11px]">
          <div>
            <div className="text-muted-text font-semibold">Games Played</div>
            <div className="text-sm font-black text-white mt-0.5">{stats.gamesPlayed}</div>
          </div>
          <div>
            <div className="text-muted-text font-semibold">Pellets Munch</div>
            <div className="text-sm font-black text-white mt-0.5">{stats.totalPelletsEaten.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 5. CONTROLS CHEATSHEET */}
      <div className="hidden xl:flex flex-col gap-2">
        <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
          <Keyboard size={12} />
          Controls Guide
        </h3>
        <div className="flex flex-col gap-1 text-[10px] text-muted-text text-left bg-white/3 rounded-[20px] p-3 border border-white/5 font-semibold">
          <div className="flex justify-between">
            <span>Move Up</span>
            <span className="text-white">W / Arrow Up</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Move Down</span>
            <span className="text-white">S / Arrow Down</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Move Left</span>
            <span className="text-white">A / Arrow Left</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Move Right</span>
            <span className="text-white">D / Arrow Right</span>
          </div>
          <div className="flex justify-between mt-1 border-t border-white/5 pt-1">
            <span>Mobile swipe/drag</span>
            <span className="text-secondary font-bold">Joystick enabled</span>
          </div>
        </div>
      </div>

    </Card>
  );
};
export default Sidebar;

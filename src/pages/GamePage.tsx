import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { leaderboardService } from '../services/leaderboardService';
import CanvasContainer from '../components/game/CanvasContainer';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import VirtualJoystick from '../components/ui/VirtualJoystick';
import { Volume2, VolumeX, Camera, Pause, Play, BarChart2, CornerDownLeft, Home, Trophy, Maximize2, Minimize2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamePageProps {
  onBackToMenu: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onBackToMenu }) => {
  // Bind keyboard listener
  useKeyboardControls();

  const {
    gameStatus,
    score,
    level,
    cameraMode,
    soundEnabled,
    powerPelletTimer,
    setCameraMode,
    toggleSound,
    startGame,
    resumeGame,
    resetGame,
    advanceNextLevel,
  } = useGameStore();

  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenToggle = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Trigger confetti on level victory
  React.useEffect(() => {
    if (gameStatus === 'victory') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#00D4FF', '#8B5CF6'],
      });
    }
    if (gameStatus === 'gameover') {
      setScoreSubmitted(false);
      setPlayerName('');
    }
  }, [gameStatus]);

  const handleCameraToggle = () => {
    setCameraMode(cameraMode === 'follow' ? 'topDown' : 'follow');
  };

  const handleHighScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    leaderboardService.submitScore(playerName, score, level);
    setScoreSubmitted(true);
  };

  return (
    <div className="w-full h-full min-h-screen relative flex flex-col bg-[#050816] overflow-hidden select-none">
      
      {/* 1. TOP HUD SECTION */}
      {!isFullscreen && <Header />}

      {/* 2. MAIN VIEWPORT */}
      <div className={`flex-1 flex flex-col lg:flex-row ${isFullscreen ? 'p-0 gap-0' : 'p-4 gap-4'} items-stretch relative overflow-hidden`}>
        
        {/* LEFT VIEWPORT: 3D canvas + floating control widgets */}
        <div className={`flex-1 relative ${isFullscreen ? 'rounded-none border-none' : 'rounded-[30px] border border-white/5'} overflow-hidden shadow-2xl min-h-[50vh] lg:min-h-0 bg-[#020308]`}>
          
          {/* Three.js R3F Canvas */}
          <CanvasContainer />

          {/* Floating Score and Level HUD during Fullscreen Zen Mode */}
          {isFullscreen && (
            <div className="absolute top-4 left-4 z-20 bg-white/5 border border-white/10 backdrop-blur-md rounded-[20px] px-4 py-2 flex items-center gap-2">
              <span className="text-[10px] text-muted-text uppercase font-black tracking-wider">Score:</span>
              <span className="text-sm text-primary font-black tracking-wide">{score.toLocaleString()}</span>
              <span className="text-[10px] text-muted-text uppercase font-black tracking-wider ml-2">Lvl:</span>
              <span className="text-sm text-secondary font-black tracking-wide">{level}</span>
            </div>
          )}

          {/* Target Indicators Overlay for Frightened State */}
          {powerPelletTimer > 0 && (
            <div className="absolute top-4 left-4 z-20 pointer-events-none bg-secondary/15 backdrop-blur-md border border-secondary/30 rounded-[20px] px-3.5 py-1.5 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
              <span className="text-[10px] text-secondary font-black uppercase tracking-wider">
                GHOSTS WEAKENED! CHOMP THEM!
              </span>
            </div>
          )}

          {/* FLOATING ACTION OVERLAYS */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            
            {/* Fullscreen Toggle Button */}
            <button
              onClick={handleFullscreenToggle}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Toggle Camera Angle Button */}
            <button
              onClick={handleCameraToggle}
              title="Toggle View Mode"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
            >
              <Camera size={18} />
            </button>

            {/* Mute toggle button */}
            <button
              onClick={toggleSound}
              title="Toggle Audio"
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-red-400" />}
            </button>

            {/* Stats Dashboard drawer button for mobile */}
            <button
              onClick={() => setMobileStatsOpen(true)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer lg:hidden transition-all active:scale-90"
            >
              <BarChart2 size={18} />
            </button>

            {/* Quick Pause button */}
            {gameStatus === 'playing' && (
              <button
                onClick={() => useGameStore.getState().pauseGame()}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
              >
                <Pause size={18} />
              </button>
            )}

            {/* Quick Home button */}
            <button
              onClick={onBackToMenu}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 backdrop-blur-md flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
            >
              <Home size={18} />
            </button>
          </div>

          {/* Swipe joystick overlay for touchscreens */}
          <VirtualJoystick />

          {/* READY COUNTDOWN SPLASH */}
          {gameStatus === 'ready' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="text-center flex flex-col items-center gap-4 animate-bounce">
                <span className="text-[10px] font-black text-secondary uppercase tracking-[0.25em] leading-none">
                  READY PLAYER ONE
                </span>
                <h2 className="text-4xl sm:text-6xl font-black text-primary uppercase m-0 leading-none neon-text-yellow select-none">
                  GET SET!
                </h2>
                <Button variant="primary" size="lg" onClick={startGame} className="mt-4 flex gap-2 font-black">
                  <Play size={16} fill="currentColor" /> Click to Play
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT VIEWPORT: Sidebar statistics panel (Only renders on desktop) */}
        {!isFullscreen && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}
      </div>

      {/* --- MOBILE STATS SIDEBAR MODAL SHEET --- */}
      <Modal
        isOpen={mobileStatsOpen}
        onClose={() => setMobileStatsOpen(false)}
        title="Settings & Dashboard"
        glow="purple"
      >
        <div className="w-full max-h-[70vh]">
          <Sidebar />
        </div>
      </Modal>

      {/* --- PAUSED MODAL --- */}
      <Modal isOpen={gameStatus === 'paused'} title="Arcade Paused" glow="purple">
        <div className="flex flex-col gap-6 text-center py-4 items-center">
          <p className="text-sm text-muted-text max-w-xs">
            Take a breather, grab a drink! Pacman is waiting.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button variant="secondary" size="md" onClick={resumeGame} className="flex gap-2 font-bold">
              <Play size={16} fill="currentColor" /> Resume Arcade
            </Button>
            <Button variant="glass" size="md" onClick={resetGame} className="flex gap-2 font-bold">
              Restart Session
            </Button>
            <Button variant="ghost" size="md" onClick={onBackToMenu} className="text-red-400">
              Exit to Menu
            </Button>
          </div>
        </div>
      </Modal>

      {/* --- LEVEL CLEAR VICTORY MODAL --- */}
      <Modal isOpen={gameStatus === 'victory'} title="Level Cleared!" glow="yellow">
        <div className="flex flex-col gap-6 text-center py-4 items-center">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(255,215,0,0.3)] animate-bounce">
            <Trophy className="text-primary" size={24} />
          </div>
          <div className="flex flex-col gap-1.5">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Perfect Run Complete!
            </h4>
            <p className="text-xs text-muted-text">
              You cleared all pellets. Ready to step up the pace?
            </p>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-[20px] px-6 py-3 w-full max-w-xs text-sm">
            <div className="flex justify-between font-semibold">
              <span className="text-muted-text">Completed Level</span>
              <span className="text-white font-bold">{level}</span>
            </div>
            <div className="flex justify-between font-semibold mt-1">
              <span className="text-muted-text">Level Score</span>
              <span className="text-primary font-black">{score.toLocaleString()}</span>
            </div>
          </div>
          <Button variant="primary" size="lg" onClick={advanceNextLevel} className="w-full max-w-xs h-12 uppercase font-black">
            Continue to Level {level + 1}
          </Button>
        </div>
      </Modal>

      {/* --- GAME OVER MODAL --- */}
      <Modal isOpen={gameStatus === 'gameover'} title="Game Over" glow="red">
        <div className="flex flex-col gap-5 text-center py-2 items-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 text-2xl font-black shadow-lg">
            ☠
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">
              Score: <span className="text-secondary font-black">{score.toLocaleString()}</span>
            </h4>
            <p className="text-xs text-muted-text">
              You reached Level {level}. Record your score in the hall of fame!
            </p>
          </div>

          {!scoreSubmitted ? (
            <form onSubmit={handleHighScoreSubmit} className="w-full max-w-xs flex flex-col gap-3">
              <div className="relative">
                <input
                  type="text"
                  maxLength={12}
                  placeholder="ENTER PLAYER NAME"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  required
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-[30px] text-white text-center font-bold tracking-widest text-sm focus:outline-none focus:border-secondary transition-all placeholder:text-muted-text/50 uppercase"
                />
              </div>
              <Button type="submit" variant="secondary" size="md" className="flex gap-2 font-black">
                <CornerDownLeft size={16} /> Save Score
              </Button>
            </form>
          ) : (
            <div className="text-green-400 font-bold text-xs bg-green-500/10 border border-green-500/20 rounded-[20px] px-6 py-3 w-full max-w-xs">
              ✓ Score recorded successfully!
            </div>
          )}

          <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
            <Button variant="primary" size="md" onClick={resetGame} className="font-bold">
              Try Again
            </Button>
            <Button variant="ghost" size="md" onClick={onBackToMenu} className="text-muted-text">
              Return to Menu
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
export default GamePage;

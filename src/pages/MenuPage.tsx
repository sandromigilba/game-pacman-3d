import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { leaderboardService } from '../services/leaderboardService';
import type { DailyChallenge } from '../services/leaderboardService';
import type { LeaderboardEntry } from '../types/game';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Trophy, Play, Palette, Sparkles, Award } from 'lucide-react';
import SEO from '../seo/SEO';

export const MenuPage: React.FC<{ onStartGame: () => void }> = ({ onStartGame }) => {
  const { theme, setTheme, highScore } = useGameStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);

  useEffect(() => {
    setLeaderboard(leaderboardService.getScores());
    setChallenges(leaderboardService.getDailyChallenges(1));
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none bg-[#050816]">
      <SEO />

      {/* Cyberpunk background grid elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl flex flex-col items-center gap-8 z-10">
        
        {/* LOGO AND HERO HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center flex flex-col items-center gap-3"
        >
          {/* Animated eating Pacman SVG icon */}
          <div className="w-16 h-16 flex items-center justify-center filter drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] animate-float">
            <svg viewBox="0 0 100 100" className="w-full h-full relative">
              {/* Upper Jaw (Yellow Sector) with Eye */}
              <g className="origin-[50px_50px] animate-chomp-top">
                <path d="M 50 50 L 95 50 A 45 45 0 0 0 5 50 Z" fill="#FFD700" />
                <circle cx="65" cy="30" r="4.5" fill="#050816" />
              </g>
              {/* Lower Jaw (Yellow Sector) */}
              <path
                d="M 50 50 L 5 50 A 45 45 0 0 0 95 50 Z"
                fill="#FFD700"
                className="origin-[50px_50px] animate-chomp-bottom"
              />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-widest text-white leading-none uppercase mt-2">
            PACMAN <span className="text-secondary neon-text-blue">3D</span>
          </h1>
          <p className="text-sm font-semibold tracking-widest text-muted-text uppercase leading-none">
            Next-Gen Cyber Arcade
          </p>
        </motion.div>

        {/* MAIN MENU GRID */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT PANEL: Play & Theme Customizer */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-7 flex flex-col gap-6"
          >
            <Card className="p-8 flex flex-col justify-center items-center text-center gap-6 flex-1">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-secondary font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Sparkles size={12} />
                  Ready to Munch?
                </span>
                <p className="text-sm text-muted-text max-w-xs">
                  Avoid the ghosts, grab the power pellets, and clean the neon corridors!
                </p>
              </div>

              {/* Huge Play buttons */}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    useGameStore.getState().setGameMode('arcade');
                    onStartGame();
                  }}
                  className="w-full flex gap-3 h-14 uppercase font-black tracking-wider"
                >
                  <Play size={18} fill="currentColor" /> Start Arcade
                </Button>
                
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    useGameStore.getState().setGameMode('practice');
                    onStartGame();
                  }}
                  className="w-full flex gap-3 h-12 uppercase font-black tracking-wide"
                >
                  <Sparkles size={16} /> Practice Mode
                </Button>
              </div>

              {/* High Score banner */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-[20px] px-4 py-2 mt-2">
                <Trophy size={16} className="text-primary" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Your High Score: <span className="text-primary">{highScore.toLocaleString()}</span>
                </span>
              </div>
            </Card>

            {/* Visual Skin Customizer */}
            <Card className="p-6">
              <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
                <Palette size={12} />
                Select Game Theme
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['neon', 'retro', 'minimalist'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`py-3 px-2 text-xs font-black uppercase tracking-wider rounded-[20px] border transition-all cursor-pointer ${
                      theme === t
                        ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                        : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-text'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* RIGHT PANEL: Leaderboard & Challenges */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-5 flex flex-col gap-6"
          >
            {/* Leaderboard Card */}
            <Card className="p-6 flex-1 flex flex-col">
              <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
                <Trophy size={12} />
                Global Leaderboard
              </h3>
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[170px] custom-scrollbar pr-1 flex-1">
                {leaderboard.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white/3 border border-white/5 rounded-[15px] p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                        index === 0 ? 'bg-primary text-black' : 'bg-white/10 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-bold text-white">{item.name}</span>
                    </div>
                    <div className="flex flex-col items-end leading-none font-semibold">
                      <span className="text-secondary font-black">{item.score.toLocaleString()}</span>
                      <span className="text-[8px] text-muted-text mt-0.5">Lvl {item.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Daily Challenges Card */}
            <Card className="p-6">
              <h3 className="text-xs font-black tracking-widest text-secondary uppercase border-b border-white/5 pb-2 mb-4 flex items-center gap-1.5">
                <Award size={12} />
                Daily Challenges
              </h3>
              <div className="flex flex-col gap-2.5 text-xs text-left">
                {challenges.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {c.completed ? (
                        <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center text-[9px] text-[#050816] font-bold">✓</div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                      )}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className={`font-bold ${c.completed ? 'line-through text-muted-text' : 'text-white'}`}>
                        {c.task}
                      </span>
                      <span className="text-[9px] text-muted-text mt-0.5">Reward: {c.reward}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </motion.div>
        </div>

        {/* ACCESSIBILITY & INSTRUCTIONS BAR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[10px] text-muted-text leading-relaxed tracking-wider border-t border-white/5 pt-4 w-full text-center flex flex-col sm:flex-row justify-between items-center gap-2"
        >
          <span>Use Keyboard WASD / Arrows to steer Pacman on PC</span>
          <span className="font-semibold text-white/50">WCAG AA & HTML5 WebGL Compliant Arcade</span>
        </motion.div>

      </div>
    </div>
  );
};
export default MenuPage;

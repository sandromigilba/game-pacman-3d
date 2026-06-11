import type { LeaderboardEntry } from '../types/game';

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'BLINKY_SLAYER', score: 24500, level: 5, date: '2026-06-11' },
  { name: 'WAKA_MASTER', score: 18200, level: 4, date: '2026-06-10' },
  { name: 'PAC_PRO', score: 15400, level: 3, date: '2026-06-09' },
  { name: 'NEON_RUNNER', score: 12900, level: 3, date: '2026-06-08' },
  { name: 'CYBER_GHOST', score: 9800, level: 2, date: '2026-06-07' },
];

export interface DailyChallenge {
  id: string;
  task: string;
  reward: string;
  completed: boolean;
}

export const leaderboardService = {
  getScores(): LeaderboardEntry[] {
    const stored = localStorage.getItem('pacman3d_leaderboard');
    if (!stored) {
      localStorage.setItem('pacman3d_leaderboard', JSON.stringify(MOCK_LEADERBOARD));
      return MOCK_LEADERBOARD;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_LEADERBOARD;
    }
  },

  submitScore(name: string, score: number, level: number): LeaderboardEntry[] {
    const scores = this.getScores();
    const newEntry: LeaderboardEntry = {
      name: name.toUpperCase().slice(0, 12) || 'PLAYER',
      score,
      level,
      date: new Date().toISOString().split('T')[0],
    };
    
    scores.push(newEntry);
    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);
    // Slice top 10
    const topScores = scores.slice(0, 10);
    localStorage.setItem('pacman3d_leaderboard', JSON.stringify(topScores));
    return topScores;
  },

  getDailyChallenges(level: number): DailyChallenge[] {
    return [
      {
        id: 'challenge_1',
        task: 'Munch 100 pellets in a single run',
        reward: 'Neon Orange theme color',
        completed: localStorage.getItem('pacman3d_stats') 
          ? JSON.parse(localStorage.getItem('pacman3d_stats') || '{}').totalPelletsEaten >= 100
          : false,
      },
      {
        id: 'challenge_2',
        task: 'Bust 3 ghosts in one game session',
        reward: 'Pacman Speed Boost (+10%)',
        completed: false, // updated on match end
      },
      {
        id: 'challenge_3',
        task: `Successfully beat Level ${level}`,
        reward: 'Trophy badge icon',
        completed: level > 1,
      },
    ];
  },
};
export default leaderboardService;

import React, { useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { useGameStore } from './store/useGameStore';
import MenuPage from './pages/MenuPage';
import GamePage from './pages/GamePage';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'menu' | 'game'>('menu');
  const initGame = useGameStore((state) => state.initGame);

  const handleStartGame = () => {
    // Initialize the Zustand store state parameters
    initGame();
    // Swap screen routes
    setActivePage('game');
  };

  const handleBackToMenu = () => {
    setActivePage('menu');
  };

  return (
    <HelmetProvider>
      <div className="w-full h-full min-h-screen bg-[#050816] text-white overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activePage === 'menu' ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <MenuPage onStartGame={handleStartGame} />
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <GamePage onBackToMenu={handleBackToMenu} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HelmetProvider>
  );
};
export default App;

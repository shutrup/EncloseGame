import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GameScreen } from './game/GameScreen';
import { HomeScreen } from './game/HomeScreen';
import { RulesScreen } from './game/RulesScreen';
import { SetupScreen } from './game/SetupScreen';
import { SettingsScreen } from './game/SettingsScreen';
import { SplashScreen } from './game/SplashScreen';
import { initTelegramWebApp } from './lib/telegram';
import { useGameStore } from './store/gameStore';

export default function App() {
  const screen = useGameStore((state) => state.screen);
  const rulesOpen = useGameStore((state) => state.rulesOpen);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initTelegramWebApp();
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_30%_0%,rgba(23,144,255,0.18),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(255,74,85,0.12),transparent_45%)]">
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {!showSplash && screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <HomeScreen />
          </motion.div>
        )}
        {!showSplash && screen === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <SetupScreen />
          </motion.div>
        )}
        {!showSplash && screen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <GameScreen />
          </motion.div>
        )}
        {!showSplash && screen === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <SettingsScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rulesOpen && <RulesScreen fromGame={screen === 'game'} />}
      </AnimatePresence>
    </main>
  );
}

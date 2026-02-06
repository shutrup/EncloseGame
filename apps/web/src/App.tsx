import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { GameScreen } from './game/GameScreen';
import { SetupScreen } from './game/SetupScreen';
import { initTelegramWebApp } from './lib/telegram';
import { useGameStore } from './store/gameStore';

export default function App() {
  const screen = useGameStore((state) => state.screen);

  useEffect(() => {
    initTelegramWebApp();
  }, []);

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_30%_0%,rgba(23,144,255,0.18),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(255,74,85,0.12),transparent_45%)]">
      <AnimatePresence mode="wait" initial={false}>
        {screen === 'setup' ? (
          <motion.div key="setup" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} exit={{ opacity: 0.4 }} transition={{ duration: 0.16 }}>
            <SetupScreen />
          </motion.div>
        ) : (
          <motion.div key="game" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} exit={{ opacity: 0.4 }} transition={{ duration: 0.16 }}>
            <GameScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

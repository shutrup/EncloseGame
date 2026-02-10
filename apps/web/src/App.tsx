import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { GameScreen } from './game/GameScreen';
import { HomeScreen } from './game/HomeScreen';
import { RulesScreen } from './game/RulesScreen';
import { SetupScreen } from './game/SetupScreen';
import { SettingsScreen } from './game/SettingsScreen';
import { SplashScreen } from './game/SplashScreen';
import { getTelegramWebApp, initTelegramWebApp } from './lib/telegram';
import { useGameStore } from './store/gameStore';

export default function App() {
  const screen = useGameStore((state) => state.screen);
  const rulesOpen = useGameStore((state) => state.rulesOpen);
  const backToHome = useGameStore((state) => state.backToHome);
  const backToSetup = useGameStore((state) => state.backToSetup);
  const closeSettings = useGameStore((state) => state.closeSettings);
  const closeRules = useGameStore((state) => state.closeRules);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initTelegramWebApp();
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (!tg?.BackButton) {
      return;
    }

    let handler: (() => void) | undefined;

    if (showSplash) {
      tg.BackButton.hide();
      return;
    }

    if (rulesOpen) {
      handler = closeRules;
    } else if (screen === 'home') {
      tg.BackButton.hide();
      return;
    } else if (screen === 'setup') {
      handler = backToHome;
    } else if (screen === 'game') {
      handler = backToSetup;
    } else if (screen === 'settings') {
      handler = closeSettings;
    }

    if (!handler) {
      tg.BackButton.hide();
      return;
    }

    tg.BackButton.show();
    tg.BackButton.onClick(handler);

    return () => {
      tg.BackButton.offClick(handler);
    };
  }, [showSplash, screen, rulesOpen, closeRules, backToHome, backToSetup, closeSettings]);

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_30%_0%,rgba(23,144,255,0.18),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(255,74,85,0.12),transparent_45%)]">
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      <AnimatePresence mode="sync" initial={false}>
        {!showSplash && screen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'linear' }}
          >
            <HomeScreen />
          </motion.div>
        )}
        {!showSplash && screen === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'linear' }}
          >
            <SetupScreen />
          </motion.div>
        )}
        {!showSplash && screen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'linear' }}
          >
            <GameScreen />
          </motion.div>
        )}
        {!showSplash && screen === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'linear' }}
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

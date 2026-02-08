import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { AILevel, BoardPreset } from '@enclose/game-core';
import { SegmentedControl } from '../components/SegmentedControl';
import { useGameStore } from '../store/gameStore';
import { useI18n } from '../store/i18n';
import { useTelegramBackButton, useTelegramMainButton } from '../hooks/useTelegram';

type GameMode = 'pvp' | 'single';

const presetOptions: { value: BoardPreset; label: string }[] = [
  { value: 'mini', label: 'Мини (13)' },
  { value: 'standard', label: 'Стандарт (25)' },
  { value: 'large', label: 'Большой (41)' }
];

const modeOptions: { value: GameMode; label: string }[] = [
  { value: 'pvp', label: 'PvP' },
  { value: 'single', label: 'Одиночная' }
];

const difficultyOptions: { value: AILevel; label: string }[] = [
  { value: 'easy', label: 'Легкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'hard', label: 'Сложный' }
];

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-panel p-4 shadow-card">
      <h3 className="mb-3 text-lg font-bold text-white/70">{title}</h3>
      {children}
    </div>
  );
}

export function SetupScreen() {
  const { setup, setPreset, setMode, setDifficulty, startGame, backToHome } = useGameStore();
  const { t } = useI18n(); // Using i18n if available, effectively

  useTelegramBackButton(backToHome);
  useTelegramMainButton('Играть', startGame);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto flex h-dvh w-full max-w-[860px] flex-col px-4 pb-6 pt-4"
    >
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-2 shrink-0 flex items-center justify-center gap-3 relative"
      >
        <h1 className="flex-1 text-center text-2xl font-black tracking-tight">Настройка игры</h1>
      </motion.header>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card title="Размер">
              <SegmentedControl value={setup.preset} options={presetOptions} onChange={setPreset} />
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card title="Режим">
              <SegmentedControl value={setup.mode} options={modeOptions} onChange={setMode} />
            </Card>
          </motion.div>

          <AnimatePresence initial={false}>
            {setup.mode === 'single' ? (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: -12 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: -12 }}
                transition={{ duration: 0.25 }}
              >
                <Card title="Сложность">
                  <SegmentedControl value={setup.difficulty} options={difficultyOptions} onChange={setDifficulty} />
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>


    </motion.div>
  );
}


import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { AILevel, BoardPreset } from '@enclose/game-core';
import { SegmentedControl } from '../components/SegmentedControl';
import { useGameStore } from '../store/gameStore';

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
    <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-4 shadow-card">
      <h3 className="mb-3 text-4xl font-bold tracking-tight text-white/85">{title}</h3>
      {children}
    </div>
  );
}

export function SetupScreen() {
  const { setup, setPreset, setMode, setDifficulty, startGame } = useGameStore();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[860px] flex-col px-4 pb-5 pt-4">
      <header className="mb-4 flex items-center justify-center">
        <h1 className="text-4xl font-black tracking-tight">Настройка игры</h1>
      </header>

      <div className="flex flex-col gap-4">
        <Card title="Размер">
          <SegmentedControl value={setup.preset} options={presetOptions} onChange={setPreset} />
        </Card>

        <Card title="Режим">
          <SegmentedControl value={setup.mode} options={modeOptions} onChange={setMode} />
        </Card>

        <AnimatePresence initial={false}>
          {setup.mode === 'single' ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <Card title="Сложность">
                <SegmentedControl value={setup.difficulty} options={difficultyOptions} onChange={setDifficulty} />
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Card title="Выбранные параметры">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <InfoTag label="Размер" value={presetOptions.find((p) => p.value === setup.preset)?.label ?? '-'} />
            <InfoTag label="Режим" value={modeOptions.find((m) => m.value === setup.mode)?.label ?? '-'} />
            {setup.mode === 'single' ? (
              <InfoTag
                label="Сложность"
                value={difficultyOptions.find((d) => d.value === setup.difficulty)?.label ?? '-'}
              />
            ) : null}
          </div>
        </Card>
      </div>

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={startGame}
          className="w-full rounded-full bg-gradient-to-r from-accent to-sky-500 px-6 py-5 text-5xl font-black text-white shadow-glow transition active:scale-[0.99]"
        >
          Играть
        </button>
      </div>
    </div>
  );
}

function InfoTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/35 px-3 py-2">
      <div className="text-[14px] text-white/55">{label}</div>
      <div className="truncate text-[20px] font-bold">{value}</div>
    </div>
  );
}

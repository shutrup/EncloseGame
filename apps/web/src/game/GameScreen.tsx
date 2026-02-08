import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ParticleEffect } from '../components/ParticleEffect';
import { soundManager } from '../lib/soundManager';
import { hapticImpact } from '../lib/telegram';
import { gameSummary, useGameStore } from '../store/gameStore';
import { BoardSvg } from './BoardSvg';
// import { BoardSvg } from './BoardSvg';
import { useTelegramBackButton } from '../hooks/useTelegram';
import { useI18n } from '../store/i18n';

export function GameScreen() {
  const {
    session,
    setup,
    aiThinking,
    hintsEnabled,
    animationsEnabled,
    soundEnabled,
    setHintsEnabled,
    playMove,
    resetMatch,
    backToSetup,
    openRules,
    closeRules,
    rulesOpen
  } = useGameStore();
  const { t } = useI18n();

  // useTelegramBackButton(backToSetup);

  const [particleTrigger, setParticleTrigger] = useState<{ x: number; y: number } | null>(null);
  const [particleColor, setParticleColor] = useState('#1690ff');
  const boardRef = useRef<HTMLDivElement>(null);
  const prevZonesRef = useRef<string[]>([]);

  // Sync sound manager with store
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Detect zone captures for particles and sounds
  useEffect(() => {
    if (!session) return;

    const currentOwners = session.state.zones.map((z) => z.owner);
    const prevOwners = prevZonesRef.current;

    if (prevOwners.length > 0) {
      let captured = false;
      for (let i = 0; i < currentOwners.length; i++) {
        if (prevOwners[i] === 'none' && currentOwners[i] !== 'none') {
          captured = true;
          // Trigger particles at zone center
          if (boardRef.current && animationsEnabled) {
            const zone = session.state.zones[i];
            const boardRect = boardRef.current.getBoundingClientRect();
            const points = zone.nodeIds.map((id) => session.board.nodes[id].position);
            const cx = points.reduce((a, p) => a + p.x, 0) / points.length;
            const cy = points.reduce((a, p) => a + p.y, 0) / points.length;

            // Simple projection (approximate center)
            const relX = 0.5 + cx / 16;
            const relY = 0.5 - cy / 16;
            setParticleColor(currentOwners[i] === 'x' ? '#1690ff' : '#ff4a55');
            setParticleTrigger({
              x: boardRect.width * relX,
              y: boardRect.height * relY
            });
            setTimeout(() => setParticleTrigger(null), 100);
          }
          break;
        }
      }

      if (captured) {
        soundManager.play('capture');
        hapticImpact('rigid');
      } else if (session.state.occupiedEdges.size > 0 && session.state.occupiedEdges.size !== prevOccupiedRef.current) {
        soundManager.play('pop');
        hapticImpact('light');
      }
    }

    prevZonesRef.current = currentOwners;
  }, [session?.state.zones, session?.state.occupiedEdges.size, animationsEnabled]);

  // Track occupied edges for pop sound
  const prevOccupiedRef = useRef(0);
  useEffect(() => {
    if (session) {
      prevOccupiedRef.current = session.state.occupiedEdges.size;
    }
  }, [session?.state.occupiedEdges.size]);

  // Play win sound when game ends
  const summary = session ? gameSummary(session) : null;
  const wasOverRef = useRef(false);
  useEffect(() => {
    if (summary?.isOver && !wasOverRef.current) {
      soundManager.play('win');
    }
    wasOverRef.current = summary?.isOver ?? false;
  }, [summary?.isOver]);

  const handleEdgeClick = useCallback(
    (edgeId: number) => {
      // If AI is thinking, ignore clicks
      if (aiThinking) return;

      playMove(edgeId);
      hapticImpact('light');
    },
    [aiThinking, playMove]
  );



  if (!session || !summary) {
    return null;
  }

  const modeLabel = setup.mode === 'single' ? t('setup.single') : t('setup.pvp');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 mx-auto flex w-full max-w-[900px] flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-[calc(env(safe-area-inset-top)+3.5rem)]"
    >
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative mb-1 flex shrink-0 items-center justify-between"
      >
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg font-bold transition active:scale-95"
          onClick={backToSetup}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 text-xl font-extrabold">Enclose</div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={resetMatch}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-base font-bold text-accent transition active:scale-95"
          >
            {t('game.new')}
          </button>
          <button
            type="button"
            onClick={openRules}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg transition active:scale-95"
          >
            ?
          </button>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="mb-1 flex shrink-0 items-center justify-between gap-2"
      >
        <ScorePill label={`X: ${summary.scoreX}`} active={session.state.currentPlayer === 'x'} accent="x" />
        <ScorePill label={`O: ${summary.scoreO}`} active={session.state.currentPlayer === 'o'} accent="o" />
      </motion.div>

      <motion.div
        key={session.state.currentPlayer}
        initial={{ scale: 0.98, opacity: 0.75 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="mb-1 shrink-0 rounded-full border border-white/10 bg-panel px-3 py-1 text-center text-lg sm:text-xl md:text-2xl font-black"
      >
        {aiThinking ? 'ИИ думает…' : `Ход ${session.state.currentPlayer.toUpperCase()}`}
      </motion.div>

      <div
        ref={boardRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-card"
      >
        <div className="pointer-events-none absolute h-[80%] w-[80%] rounded-full bg-accent/15 blur-3xl" />
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <BoardSvg
            session={session}
            disabled={!!aiThinking || (setup.mode === 'single' && session.state.currentPlayer === 'o')}
            showHints={hintsEnabled}
            animationsEnabled={animationsEnabled}
            onEdgeClick={handleEdgeClick}
          // selectedEdge={selectedEdge}
          />
        </div>
        <ParticleEffect trigger={particleTrigger} color={particleColor} />
      </div>

      <div className="mt-2 grid shrink-0 grid-cols-3 gap-2">
        <StatCard icon="≡" label="Линии" value={`${session.state.occupiedEdges.size}/${session.board.edges.length}`} />
        <StatCard icon="⊞" label="Клетки" value={`${summary.scoreX + summary.scoreO}/${session.state.zones.length}`} />
        <StatCard icon="👤" label="Режим" value={modeLabel} />
      </div>

      <div className="mt-2 flex shrink-0 items-center justify-between rounded-2xl border border-white/10 bg-panel/80 px-3 py-1.5">
        <span className="text-white/70">Подсказки захвата</span>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-sm font-bold ${hintsEnabled ? 'bg-accent text-white' : 'bg-white/10 text-white/70'}`}
          onClick={() => setHintsEnabled(!hintsEnabled)}
        >
          {hintsEnabled ? 'Вкл' : 'Выкл'}
        </button>
      </div>

      {summary.isOver ? (
        <GameOverOverlay
          winner={summary.winner}
          margin={summary.margin}
          scoreX={summary.scoreX}
          scoreO={summary.scoreO}
          onRestart={resetMatch}
          onSetup={backToSetup}
        />
      ) : null}

      {rulesOpen ? <RulesOverlay onClose={closeRules} /> : null}
    </motion.div>
  );
}

function ScorePill({ label, active, accent }: { label: string; active: boolean; accent: 'x' | 'o' }) {
  const dotClass = accent === 'x' ? 'bg-x' : 'bg-o';
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-base font-bold ${active ? 'border-white/30 bg-white/8' : 'border-white/10 bg-panel/70 text-white/65'}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-panel/80 px-2 py-1.5 min-w-0">
      <div className="flex items-center gap-1 text-[11px] text-white/50 mb-0.5">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="truncate text-base font-bold leading-tight tracking-tight">{value}</div>
    </div>
  );
}

function GameOverOverlay({
  winner,
  margin,
  scoreX,
  scoreO,
  onRestart,
  onSetup
}: {
  winner: 'x' | 'o' | 'draw' | null;
  margin: number;
  scoreX: number;
  scoreO: number;
  onRestart: () => void;
  onSetup: () => void;
}) {
  const title = winner === 'draw' ? 'Ничья' : winner === 'x' ? 'Победа X' : 'Победа O';

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[460px] rounded-[30px] border border-white/15 bg-panel p-6 shadow-card"
      >
        <div className="mb-2 text-center text-5xl font-black">{title}</div>
        <div className="mb-1 text-center text-6xl font-black">{scoreX} : {scoreO}</div>
        {winner !== 'draw' ? <div className="mb-4 text-center text-white/70">Преимущество: {margin}</div> : <div className="mb-4" />}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="rounded-2xl bg-accent px-4 py-3 font-black" onClick={onRestart}>
            Играть снова
          </button>
          <button type="button" className="rounded-2xl bg-white/10 px-4 py-3 font-black" onClick={onSetup}>
            В меню
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RulesOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-[520px] rounded-[28px] border border-white/15 bg-panel p-5">
        <div className="mb-3 text-5xl font-black">Правила</div>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-white/80">
          <li>Проводи линии между соседними точками.</li>
          <li>Кто замыкает квадрат, забирает его себе.</li>
          <li>За захват клетки дается дополнительный ход.</li>
          <li>Побеждает игрок с большим количеством клеток.</li>
        </ul>
        <button type="button" className="w-full rounded-2xl bg-accent px-4 py-3 font-black" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { gameSummary, useGameStore } from '../store/gameStore';
import { BoardSvg } from './BoardSvg';

export function GameScreen() {
  const {
    session,
    setup,
    aiThinking,
    hintsEnabled,
    setHintsEnabled,
    playMove,
    resetMatch,
    backToSetup,
    openRules,
    closeRules,
    rulesOpen
  } = useGameStore();

  if (!session) {
    return null;
  }

  const summary = gameSummary(session);
  const modeLabel = setup.mode === 'single' ? 'Одиночная' : 'PvP';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[900px] flex-col px-4 pb-5 pt-3">
      <header className="mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <button
          type="button"
          className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-[22px] font-black"
          onClick={backToSetup}
        >
          ←
        </button>

        <div className="truncate text-center text-5xl font-black">Enclose</div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetMatch}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-3xl font-bold text-accent"
          >
            Новая
          </button>
          <button
            type="button"
            onClick={openRules}
            className="h-11 w-11 rounded-full border border-white/20 bg-white/5 text-2xl"
          >
            ?
          </button>
        </div>
      </header>

      <div className="mb-3 flex items-center justify-between gap-4">
        <ScorePill label={`X: ${summary.scoreX}`} active={session.state.currentPlayer === 'x'} accent="x" />
        <ScorePill label={`O: ${summary.scoreO}`} active={session.state.currentPlayer === 'o'} accent="o" />
      </div>

      <motion.div
        key={session.state.currentPlayer}
        initial={{ scale: 0.98, opacity: 0.75 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="mb-3 rounded-full border border-white/10 bg-panel px-4 py-2 text-center text-4xl font-black"
      >
        {aiThinking ? 'ИИ думает…' : `Ход ${session.state.currentPlayer.toUpperCase()}`}
      </motion.div>

      <div className="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-card">
        <div className="absolute h-[80%] w-[80%] rounded-full bg-accent/15 blur-3xl" />
        <BoardSvg
          session={session}
          disabled={aiThinking || (setup.mode === 'single' && session.state.currentPlayer === 'o')}
          showHints={hintsEnabled}
          onEdgeClick={playMove}
        />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <StatCard label="Линии" value={`${session.state.occupiedEdges.size}/${session.board.edges.length}`} />
        <StatCard label="Клетки" value={`${summary.scoreX + summary.scoreO}/${session.state.zones.length}`} />
        <StatCard label="Режим" value={modeLabel} />
      </div>

      <div className="mb-2 flex items-center justify-between rounded-2xl border border-white/10 bg-panel/80 px-4 py-2">
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
    </div>
  );
}

function ScorePill({ label, active, accent }: { label: string; active: boolean; accent: 'x' | 'o' }) {
  const dotClass = accent === 'x' ? 'bg-x' : 'bg-o';
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-5xl font-black ${active ? 'border-white/30 bg-white/8' : 'border-white/10 bg-panel/70 text-white/65'}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-panel px-3 py-2">
      <div className="text-[14px] text-white/60">{label}</div>
      <div className="truncate text-4xl font-black">{value}</div>
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

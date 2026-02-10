import { create } from 'zustand';
import { requestAIMove } from '../lib/aiApi';
import {
  type AILevel,
  type BoardPreset,
  type GameSession,
  computeAIMove,
  createGameSession,
  getCurrentScores,
  isSessionOver,
  playEdge,
  resetSession,
  scoreMargin,
  winner
} from '@enclose/game-core';

type GameMode = 'pvp' | 'single';

type Screen = 'home' | 'setup' | 'game' | 'settings';

interface SetupState {
  preset: BoardPreset;
  mode: GameMode;
  difficulty: AILevel;
}

interface GameStore {
  screen: Screen;
  setup: SetupState;
  session?: GameSession;
  aiThinking: boolean;
  hintsEnabled: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  rulesOpen: boolean;

  setPreset: (preset: BoardPreset) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (level: AILevel) => void;
  setHintsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;

  goToSetup: () => void;
  startGame: () => void;
  backToSetup: () => void;
  backToHome: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetMatch: () => void;
  playMove: (edgeId: number) => void;
  closeGameOver: () => void;
  openRules: () => void;
  closeRules: () => void;
}

let aiTimer: ReturnType<typeof setTimeout> | undefined;

const clearAiTimer = () => {
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = undefined;
  }
};

function shouldAiPlay(session: GameSession | undefined, mode: GameMode): boolean {
  if (!session || mode !== 'single') {
    return false;
  }
  return session.state.currentPlayer === 'o' && !isSessionOver(session);
}

function scheduleAIMove(set: (update: Partial<GameStore>) => void, get: () => GameStore): void {
  const { session, setup } = get();
  if (!shouldAiPlay(session, setup.mode)) {
    set({ aiThinking: false });
    return;
  }

  clearAiTimer();
  set({ aiThinking: true });

  aiTimer = setTimeout(() => {
    void (async () => {
      const snapshot = get();
      if (!snapshot.session) {
        set({ aiThinking: false });
        return;
      }

      const targetSession = snapshot.session;
      const difficulty = snapshot.setup.difficulty;
      const apiMove = await requestAIMove(targetSession, difficulty);

      const current = get();
      if (!current.session || current.session !== targetSession) {
        set({ aiThinking: false });
        return;
      }

      const move = apiMove ?? computeAIMove(current.session, difficulty);
      if (move === undefined) {
        set({ aiThinking: false });
        return;
      }

      const result = playEdge(current.session, move);
      const nextSession = result.session;

      set({ session: nextSession, aiThinking: false });

      if (shouldAiPlay(nextSession, current.setup.mode)) {
        scheduleAIMove(set, get);
      }
    })();
  }, 560);
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'home',
  setup: {
    preset: 'standard',
    mode: 'pvp',
    difficulty: 'medium'
  },
  aiThinking: false,
  hintsEnabled: true,
  soundEnabled: true,
  animationsEnabled: true,
  rulesOpen: false,

  setPreset: (preset) => set((state) => ({ setup: { ...state.setup, preset } })),
  setMode: (mode) => set((state) => ({ setup: { ...state.setup, mode } })),
  setDifficulty: (difficulty) => set((state) => ({ setup: { ...state.setup, difficulty } })),
  setHintsEnabled: (hintsEnabled) => set({ hintsEnabled }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),

  goToSetup: () => set({ screen: 'setup' }),

  startGame: () => {
    clearAiTimer();
    const { setup } = get();
    const session = createGameSession({
      preset: setup.preset,
      aiLevel: setup.mode === 'single' ? setup.difficulty : undefined
    });

    set({
      screen: 'game',
      session,
      aiThinking: false,
      rulesOpen: false
    });
  },

  backToSetup: () => {
    clearAiTimer();
    set({ screen: 'setup', session: undefined, aiThinking: false, rulesOpen: false });
  },

  backToHome: () => {
    clearAiTimer();
    set({ screen: 'home', session: undefined, aiThinking: false, rulesOpen: false });
  },

  openSettings: () => set({ screen: 'settings' }),
  closeSettings: () => set({ screen: 'home' }),

  resetMatch: () => {
    clearAiTimer();
    const current = get();
    if (!current.session) {
      return;
    }

    const session = resetSession(current.session, {
      preset: current.setup.preset,
      aiLevel: current.setup.mode === 'single' ? current.setup.difficulty : undefined
    });

    set({ session, aiThinking: false, rulesOpen: false });

    if (shouldAiPlay(session, current.setup.mode)) {
      scheduleAIMove(set, get);
    }
  },

  playMove: (edgeId) => {
    const current = get();
    if (!current.session || current.aiThinking) {
      return;
    }

    if (current.setup.mode === 'single' && current.session.state.currentPlayer === 'o') {
      return;
    }

    const result = playEdge(current.session, edgeId);
    if (!result.played) {
      return;
    }

    const session = result.session;
    set({ session });

    if (shouldAiPlay(session, current.setup.mode)) {
      scheduleAIMove(set, get);
    }
  },

  closeGameOver: () => {
    set({});
  },

  openRules: () => set({ rulesOpen: true }),
  closeRules: () => set({ rulesOpen: false })
}));

export function gameSummary(session: GameSession | undefined): {
  scoreX: number;
  scoreO: number;
  isOver: boolean;
  winner: ReturnType<typeof winner>;
  margin: number;
} {
  if (!session) {
    return {
      scoreX: 0,
      scoreO: 0,
      isOver: false,
      winner: null,
      margin: 0
    };
  }

  const scores = getCurrentScores(session);
  return {
    scoreX: scores.x,
    scoreO: scores.o,
    isOver: isSessionOver(session),
    winner: winner(session),
    margin: scoreMargin(session)
  };
}

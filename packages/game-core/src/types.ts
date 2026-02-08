export type Player = 'x' | 'o';
export type ZoneOwner = 'none' | Player;

export type BoardPreset = 'mini' | 'standard' | 'large';
export type AILevel = 'easy' | 'medium' | 'hard' | 'learning';

export interface Node {
  id: number;
  position: {
    x: number;
    y: number;
  };
}

export interface Edge {
  id: number;
  a: number;
  b: number;
}

export interface Zone {
  id: number;
  nodeIds: number[];
  edgeIds: number[];
  owner: ZoneOwner;
}

export interface BoardLayout {
  nodes: Node[];
  edges: Edge[];
  zones: Zone[];
}

export interface LastMove {
  edgeId: number;
  player: Player;
}

export interface GameState {
  currentPlayer: Player;
  occupiedEdges: Set<number>;
  zones: Zone[];
}

export interface GameSession {
  board: BoardLayout;
  preset: BoardPreset;
  aiLevel?: AILevel;
  state: GameState;
  lastMove?: LastMove;
}

export const BOARD_PRESET_ROWS: Record<BoardPreset, number[]> = {
  mini: [1, 3, 5, 3, 1],
  standard: [1, 3, 5, 7, 5, 3, 1],
  large: [1, 3, 5, 7, 9, 7, 5, 3, 1]
};

export const AI_LEVELS: AILevel[] = ['easy', 'medium', 'hard', 'learning'];

export function nextPlayer(player: Player): Player {
  return player === 'x' ? 'o' : 'x';
}

export function isPlayerOwner(owner: ZoneOwner, player: Player): boolean {
  return owner === player;
}

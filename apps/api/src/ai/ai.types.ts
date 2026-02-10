export type Player = 'x' | 'o';
export type ZoneOwner = 'none' | Player;
export type AILevel = 'easy' | 'medium' | 'hard';

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

export interface GameStatePayload {
  currentPlayer: Player;
  occupiedEdges: number[];
  zones: Zone[];
}

export interface AiMoveRequest {
  board: BoardLayout;
  state: GameStatePayload;
  level: AILevel;
}

export interface GameState {
  currentPlayer: Player;
  occupiedEdges: Set<number>;
  zones: Zone[];
}

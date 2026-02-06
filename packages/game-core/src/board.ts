import { BOARD_PRESET_ROWS, type BoardLayout, type BoardPreset, type Edge, type Node, type Zone } from './types';

const CELL_SIZE = 2;
const HALF = CELL_SIZE / 2;
const STEP = 2;

export function createBoardLayout(rows: number[]): BoardLayout {
  const yStart = (rows.length - 1) / 2;

  const rowDefs = rows.map((count, index) => {
    const y = (yStart - index) * STEP;
    const start = -((count - 1) / 2);
    const xs = Array.from({ length: count }, (_, i) => (start + i) * STEP);
    return { y, xs };
  });

  const nodeMap = new Map<string, number>();
  const edgeMap = new Map<string, number>();
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const zones: Zone[] = [];

  const nodeKey = (x: number, y: number) => `${x}:${y}`;
  const edgeKey = (a: number, b: number) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `${min}:${max}`;
  };

  const getNodeId = (x: number, y: number): number => {
    const key = nodeKey(x, y);
    const existing = nodeMap.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const id = nodes.length;
    nodeMap.set(key, id);
    nodes.push({
      id,
      position: { x, y }
    });
    return id;
  };

  const getEdgeId = (a: number, b: number): number => {
    const key = edgeKey(a, b);
    const existing = edgeMap.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const id = edges.length;
    edgeMap.set(key, id);
    edges.push({
      id,
      a: Math.min(a, b),
      b: Math.max(a, b)
    });
    return id;
  };

  let zoneId = 0;

  for (const row of rowDefs) {
    for (const x of row.xs) {
      const topLeft = getNodeId(x - HALF, row.y + HALF);
      const topRight = getNodeId(x + HALF, row.y + HALF);
      const bottomLeft = getNodeId(x - HALF, row.y - HALF);
      const bottomRight = getNodeId(x + HALF, row.y - HALF);

      const e1 = getEdgeId(topLeft, topRight);
      const e2 = getEdgeId(topRight, bottomRight);
      const e3 = getEdgeId(bottomRight, bottomLeft);
      const e4 = getEdgeId(bottomLeft, topLeft);

      zones.push({
        id: zoneId,
        nodeIds: [topLeft, topRight, bottomRight, bottomLeft],
        edgeIds: [e1, e2, e3, e4],
        owner: 'none'
      });

      zoneId += 1;
    }
  }

  return { nodes, edges, zones };
}

export function createBoardFromPreset(preset: BoardPreset): BoardLayout {
  return createBoardLayout(BOARD_PRESET_ROWS[preset]);
}

export function getBoardBounds(board: BoardLayout): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const xs = board.nodes.map((node) => node.position.x);
  const ys = board.nodes.map((node) => node.position.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

import { getBoardBounds, nearCaptureEdgeIds, type GameSession } from '@enclose/game-core';

interface BoardSvgProps {
  session: GameSession;
  disabled: boolean;
  showHints: boolean;
  onEdgeClick: (edgeId: number) => void;
}

const GRID_COLOR = 'rgba(146, 154, 171, 0.28)';
const ACTIVE_COLOR = '#f8fafc';

export function BoardSvg({ session, disabled, showHints, onEdgeClick }: BoardSvgProps) {
  const bounds = getBoardBounds(session.board);
  const padding = 1.4;

  const minX = bounds.minX - padding;
  const maxX = bounds.maxX + padding;
  const minY = -bounds.maxY - padding;
  const maxY = -bounds.minY + padding;

  const width = maxX - minX;
  const height = maxY - minY;

  const project = (nodeId: number) => {
    const node = session.board.nodes[nodeId];
    return {
      x: node.position.x,
      y: -node.position.y
    };
  };

  const hintEdges = showHints ? new Set(nearCaptureEdgeIds(session.state)) : new Set<number>();
  const lastMove = session.lastMove;

  return (
    <svg className="h-full w-full" viewBox={`${minX} ${minY} ${width} ${height}`} role="img" aria-label="Game board">
      <g>
        {session.board.edges.map((edge) => {
          const a = project(edge.a);
          const b = project(edge.b);
          const occupied = session.state.occupiedEdges.has(edge.id);
          const isLastMove = occupied && lastMove?.edgeId === edge.id;

          const color = isLastMove ? (lastMove?.player === 'x' ? '#1690ff' : '#ff4a55') : occupied ? ACTIVE_COLOR : GRID_COLOR;

          return (
            <line
              key={`edge-${edge.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeOpacity={isLastMove ? 1 : occupied ? 0.95 : 1}
              strokeWidth={occupied ? 0.22 : 0.14}
              strokeLinecap="round"
            />
          );
        })}

        {showHints
          ? Array.from(hintEdges).map((edgeId) => {
              const edge = session.board.edges.find((item) => item.id === edgeId);
              if (!edge || session.state.occupiedEdges.has(edgeId)) {
                return null;
              }

              const a = project(edge.a);
              const b = project(edge.b);
              const color = session.state.currentPlayer === 'x' ? '#1690ff' : '#ff4a55';

              return (
                <line
                  key={`hint-${edgeId}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={color}
                  strokeOpacity={0.55}
                  strokeWidth={0.16}
                  strokeLinecap="round"
                  strokeDasharray="0.35 0.22"
                />
              );
            })
          : null}

        {session.board.nodes.map((node) => (
          <circle key={`node-${node.id}`} cx={node.position.x} cy={-node.position.y} r={0.08} fill="rgba(180,188,206,0.45)" />
        ))}

        {session.state.zones
          .filter((zone) => zone.owner !== 'none')
          .map((zone) => {
            const points = zone.nodeIds.map((nodeId) => session.board.nodes[nodeId].position);
            const centerX = points.reduce((acc, p) => acc + p.x, 0) / points.length;
            const centerY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
            const owner = zone.owner === 'x' ? 'X' : 'O';
            const color = zone.owner === 'x' ? '#1690ff' : '#ff4a55';

            return (
              <text
                key={`zone-${zone.id}`}
                x={centerX}
                y={-centerY + 0.1}
                fill={color}
                fontSize={0.92}
                fontWeight={900}
                textAnchor="middle"
                style={{ userSelect: 'none', paintOrder: 'stroke', stroke: 'rgba(5, 8, 12, 0.6)', strokeWidth: 0.05 }}
              >
                {owner}
              </text>
            );
          })}

        {!disabled
          ? session.board.edges.map((edge) => {
              if (session.state.occupiedEdges.has(edge.id)) {
                return null;
              }

              const a = project(edge.a);
              const b = project(edge.b);

              return (
                <line
                  key={`hit-${edge.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgba(255,255,255,0.001)"
                  strokeWidth={0.75}
                  strokeLinecap="round"
                  pointerEvents="stroke"
                  onClick={() => onEdgeClick(edge.id)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })
          : null}
      </g>
    </svg>
  );
}

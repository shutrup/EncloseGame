import { getBoardBounds, nearCaptureEdgeIds, type GameSession } from '@enclose/game-core';
import { useRef, useEffect, useState } from 'react';

interface BoardSvgProps {
  session: GameSession;
  disabled: boolean;
  showHints: boolean;
  animationsEnabled: boolean;
  onEdgeClick: (edgeId: number) => void;
}

const GRID_COLOR = 'rgba(146, 154, 171, 0.28)';
const ACTIVE_COLOR = '#f8fafc';
const X_COLOR = '#1690ff';
const O_COLOR = '#ff4a55';

export function BoardSvg({ session, disabled, showHints, animationsEnabled, onEdgeClick }: BoardSvgProps) {
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

  // Track previously occupied edges for animation
  const prevOccupiedRef = useRef<Set<number>>(new Set());
  const [newEdges, setNewEdges] = useState<Set<number>>(new Set());

  useEffect(() => {
    const current = session.state.occupiedEdges;
    const prev = prevOccupiedRef.current;

    const added = new Set<number>();
    current.forEach((id) => {
      if (!prev.has(id)) added.add(id);
    });

    // Always update ref BEFORE triggering animation
    prevOccupiedRef.current = new Set(current);

    if (added.size > 0 && animationsEnabled) {
      setNewEdges(added);
      const timeout = setTimeout(() => setNewEdges(new Set()), 350);
      return () => clearTimeout(timeout);
    }
  }, [session.state.occupiedEdges, animationsEnabled]);

  return (
    <svg
      className="h-full w-full"
      viewBox={`${minX} ${minY} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: 'visible' }}
      role="img"
      aria-label="Game board"
    >
      {/* Inline keyframes */}
      <defs>
        <style>{`
          @keyframes edge-grow {
            from { stroke-dashoffset: 1; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes hint-pulse {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 0.72; }
          }
        `}</style>
      </defs>

      <g>
        {/* Grid edges */}
        {session.board.edges.map((edge) => {
          const a = project(edge.a);
          const b = project(edge.b);
          const occupied = session.state.occupiedEdges.has(edge.id);
          const isLastMove = occupied && lastMove?.edgeId === edge.id;
          const isNew = newEdges.has(edge.id);

          const color = isLastMove
            ? (lastMove?.player === 'x' ? X_COLOR : O_COLOR)
            : occupied
              ? ACTIVE_COLOR
              : GRID_COLOR;

          const edgeLength = Math.hypot(b.x - a.x, b.y - a.y);

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
              style={
                isNew && animationsEnabled
                  ? {
                    strokeDasharray: edgeLength,
                    strokeDashoffset: edgeLength,
                    animation: 'edge-grow 0.3s ease-out forwards'
                  }
                  : undefined
              }
            />
          );
        })}

        {/* Glow for last move */}
        {lastMove && (
          (() => {
            const edge = session.board.edges.find((e) => e.id === lastMove.edgeId);
            if (!edge) return null;
            const a = project(edge.a);
            const b = project(edge.b);
            const color = lastMove.player === 'x' ? X_COLOR : O_COLOR;

            return (
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeOpacity={0.35}
                strokeWidth={0.5}
                strokeLinecap="round"
                style={{ filter: 'blur(0.08px)' }}
              />
            );
          })()
        )}

        {/* Hint edges with pulsing animation */}
        {showHints &&
          Array.from(hintEdges).map((edgeId) => {
            const edge = session.board.edges.find((item) => item.id === edgeId);
            if (!edge || session.state.occupiedEdges.has(edgeId)) return null;

            const a = project(edge.a);
            const b = project(edge.b);
            const color = session.state.currentPlayer === 'x' ? X_COLOR : O_COLOR;

            return (
              <line
                key={`hint-${edgeId}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={color}
                strokeWidth={0.16}
                strokeLinecap="round"
                strokeDasharray="0.35 0.22"
                style={
                  animationsEnabled
                    ? { animation: 'hint-pulse 0.9s ease-in-out infinite' }
                    : { opacity: 0.55 }
                }
              />
            );
          })}

        {/* Nodes */}
        {session.board.nodes.map((node) => (
          <circle
            key={`node-${node.id}`}
            cx={node.position.x}
            cy={-node.position.y}
            r={0.08}
            fill="rgba(180,188,206,0.45)"
          />
        ))}

        {/* Zone symbols */}
        {session.state.zones
          .filter((zone) => zone.owner !== 'none')
          .map((zone) => {
            const points = zone.nodeIds.map((nodeId) => session.board.nodes[nodeId].position);
            const centerX = points.reduce((acc, p) => acc + p.x, 0) / points.length;
            const centerY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
            const owner = zone.owner === 'x' ? 'X' : 'O';
            const color = zone.owner === 'x' ? X_COLOR : O_COLOR;

            return (
              <text
                key={`zone-${zone.id}`}
                x={centerX}
                y={-centerY}
                fill={color}
                fontSize={0.85}
                fontWeight={900}
                textAnchor="middle"
                dominantBaseline="middle"
                dy="0.08em"
                style={{ userSelect: 'none', paintOrder: 'stroke', stroke: 'rgba(5, 8, 12, 0.6)', strokeWidth: 0.04 }}
              >
                {owner}
              </text>
            );
          })}

        {/* Hit targets */}
        {!disabled &&
          session.board.edges.map((edge) => {
            if (session.state.occupiedEdges.has(edge.id)) return null;

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
                strokeWidth={0.65}
                strokeLinecap="round"
                pointerEvents="stroke"
                onClick={() => onEdgeClick(edge.id)}
                style={{ cursor: 'pointer', touchAction: 'manipulation' }}
              />
            );
          })}
      </g>
    </svg>
  );
}


import { BadRequestException, Injectable } from '@nestjs/common';
import { chooseBestMove } from './ai.engine';
import type { AILevel, AiMoveRequest, BoardLayout, GameState } from './ai.types';

@Injectable()
export class AiService {
  getMove(payload: AiMoveRequest): { move: number | null } {
    this.validatePayload(payload);

    const state: GameState = {
      currentPlayer: payload.state.currentPlayer,
      occupiedEdges: new Set(payload.state.occupiedEdges),
      zones: payload.state.zones
    };

    const move = chooseBestMove(payload.board, state, payload.level);
    return { move: move ?? null };
  }

  private validatePayload(payload: AiMoveRequest): void {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid payload');
    }

    if (!this.isValidLevel(payload.level)) {
      throw new BadRequestException('Invalid AI level');
    }

    if (!payload.board || !Array.isArray(payload.board.nodes) || !Array.isArray(payload.board.edges) || !Array.isArray(payload.board.zones)) {
      throw new BadRequestException('Invalid board');
    }

    if (!payload.state || !Array.isArray(payload.state.occupiedEdges) || !Array.isArray(payload.state.zones)) {
      throw new BadRequestException('Invalid state');
    }

    if (!this.isValidPlayer(payload.state.currentPlayer)) {
      throw new BadRequestException('Invalid currentPlayer');
    }

    if (!this.isValidBoard(payload.board)) {
      throw new BadRequestException('Malformed board topology');
    }
  }

  private isValidLevel(level: unknown): level is AILevel {
    return level === 'easy' || level === 'medium' || level === 'hard';
  }

  private isValidPlayer(value: unknown): value is 'x' | 'o' {
    return value === 'x' || value === 'o';
  }

  private isValidBoard(board: BoardLayout): boolean {
    for (const edge of board.edges) {
      if (!Number.isInteger(edge.id) || !Number.isInteger(edge.a) || !Number.isInteger(edge.b)) {
        return false;
      }
    }

    for (const zone of board.zones) {
      if (!Number.isInteger(zone.id) || !Array.isArray(zone.edgeIds) || zone.edgeIds.length === 0) {
        return false;
      }
    }

    return true;
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import type { AiMoveRequest } from './ai.types';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('move')
  move(@Body() payload: AiMoveRequest) {
    return this.aiService.getMove(payload);
  }
}

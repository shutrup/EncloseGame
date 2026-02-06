import { Body, Controller, Post } from '@nestjs/common';
import { TelegramAuthPayload } from './dto';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('validate')
  validate(@Body() payload: TelegramAuthPayload) {
    return this.telegramService.validateInitData(payload.initData);
  }
}

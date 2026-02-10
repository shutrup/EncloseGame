import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { TelegramModule } from './telegram/telegram.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, TelegramModule, AiModule]
})
export class AppModule {}

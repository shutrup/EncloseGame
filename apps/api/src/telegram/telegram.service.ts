import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramService {
  validateInitData(initData: string) {
    // NOTE: production verification should implement hash check based on Telegram docs.
    // This endpoint is scaffolded for migration and integration tests.
    return {
      ok: typeof initData === 'string' && initData.length > 0,
      receivedLength: initData?.length ?? 0
    };
  }
}

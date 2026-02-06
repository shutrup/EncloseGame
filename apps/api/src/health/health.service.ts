import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      service: 'enclose-api',
      now: new Date().toISOString()
    };
  }
}

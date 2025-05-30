// db/key-store.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { DB_CLIENT } from './db.client.provider';
import { AccessKeyRecordDto } from './dto/access-key-record.dto';

const ACCESS_KEY_PREFIX = 'L2_ACCESS_KEY'
const RATE_LIMIT_PREFIX = `RATE_LIMIT`

@Injectable()
export class AccessKeyDbService {
  private readonly logger = new Logger(AccessKeyDbService.name);
  constructor(@Inject(DB_CLIENT) private readonly redis: Redis) { }

  async setAccessKey(key: string, value: AccessKeyRecordDto) {
    return this.redis.set(`${ACCESS_KEY_PREFIX}:${key}`, JSON.stringify(value));
  }

  async getAccessKey(key: string): Promise<AccessKeyRecordDto | null> {
    const data = await this.redis.get(`${ACCESS_KEY_PREFIX}:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteAccessKey(key: string) {
    return this.redis.del(`${ACCESS_KEY_PREFIX}:${key}`);
  }

  async isWithinRateLimit(key: string, rateLimitPerMin: number): Promise<boolean> {
    const logKey = `isWithinRateLimit:`
    const count = await this.redis.incr(`${RATE_LIMIT_PREFIX}:${key}`);
    if (count === 1) await this.redis.expire(`${RATE_LIMIT_PREFIX}:${key}`, 60); // 1-minute window
    this.logger.debug(`${logKey} ${JSON.stringify({key, rateLimitPerMin, count})}`);
    return count <= rateLimitPerMin;
  }
}

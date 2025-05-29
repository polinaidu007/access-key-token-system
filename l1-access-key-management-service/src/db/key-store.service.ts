// db/key-store.service.ts
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DB_CLIENT } from './db.client.provider';
import { KeyRecordDto } from './dto/key-db-record.dto';

const ACCESS_KEY_PREFIX = 'ACCESS_KEY'

@Injectable()
export class KeyStoreService {
    constructor(@Inject(DB_CLIENT) private readonly redis: Redis) { }

    async setAccessKey(key: string, value: KeyRecordDto) {
        return this.redis.set(`${ACCESS_KEY_PREFIX}:${key}`, JSON.stringify(value));
    }

    async getAccessKey(key: string): Promise<KeyRecordDto | null> {
        const data = await this.redis.get(`${ACCESS_KEY_PREFIX}:${key}`);
        return data ? JSON.parse(data) : null;
    }

    async getAllAccessKeys() : Promise<KeyRecordDto[]> {
        const keys = await this.redis.keys(`${ACCESS_KEY_PREFIX}:*`);
        if (keys.length === 0) return [];

        const values = await this.redis.mget(...keys);
        return values.map((val) => (val ? JSON.parse(val) : null));
    }

    async deleteAccessKey(key: string) {
        return this.redis.del(`${ACCESS_KEY_PREFIX}:${key}`);
    }
}

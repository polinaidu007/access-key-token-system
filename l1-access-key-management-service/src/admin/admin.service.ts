// src/admin/admin.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { KeyStoreService } from '../db/key-store.service';
import { StreamingProducerService } from '../streaming/streaming.producer.service';
import { StreamingEvent, StreamName } from 'src/constants/streaming.constants';
import { CreateKeyDto } from './dto/create-key.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly keyStore: KeyStoreService,
    private readonly producer: StreamingProducerService,
  ) {}

  async createKey(payload: CreateKeyDto) {
    const key = payload.key;
    const existing = await this.keyStore.getAccessKey(key);
    if (existing) throw new ConflictException('Key already exists');

    await this.keyStore.setAccessKey(key, {...payload, enabled : true});
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
      event: StreamingEvent.KEY_CREATED,
      ...payload,
      enabled : true
    });
    return { message: 'Key created' };
  }

  async getKey(key: string) {
    return this.keyStore.getAccessKey(key);
  }

  async listKeys() {
    // You need to keep track of all keys in a list key like "access-keys:list"
    const keys = await this.keyStore.getAllAccessKeys();
    return keys || [];
  }

  async updateKey(key: string, newData: any) {
    const existing = await this.keyStore.getAccessKey(key);
    if (!existing) throw new Error('404: Key not found');

    const updated = { ...existing, ...newData };
    await this.keyStore.setAccessKey(key, updated);
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
      event: StreamingEvent.KEY_UPDATED,
      key,
      ...updated,
    });
    return { message: 'Key updated' };
  }

  async deleteKey(key: string) {
    await this.keyStore.deleteAccessKey(key);
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
      event: StreamingEvent.KEY_DELETED,
      key,
    });
    return { message: 'Key deleted' };
  }
}

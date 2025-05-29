// src/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { KeyStoreService } from '../db/key-store.service';
import { StreamingProducerService } from 'src/streaming/streaming.producer.service';
import { StreamingEvent, StreamName } from 'src/constants/streaming.constants';

@Injectable()
export class UserService {
  constructor(
    private readonly keyStore: KeyStoreService,
    private readonly producer: StreamingProducerService,
  ) {}

  async getKeyInfo(key: string) {
    const data = await this.keyStore.getAccessKey(key);
    if (!data) throw new NotFoundException('Invalid key');
    return data;
  }

  async disableKey(key: string) {
    const data = await this.keyStore.getAccessKey(key);
    if (!data) throw new NotFoundException('404: Key not found');

    data.enabled = false;
    await this.keyStore.setAccessKey(key, data);
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
          event: StreamingEvent.KEY_UPDATED,
          key,
          ...data,
        });
    return { message: 'Key disabled' };
  }
}

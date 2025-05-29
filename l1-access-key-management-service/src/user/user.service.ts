// src/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { KeyStoreService } from '../db/key-store.service';

@Injectable()
export class UserService {
  constructor(private readonly keyStore: KeyStoreService) {}

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
    return { message: 'Key disabled' };
  }
}

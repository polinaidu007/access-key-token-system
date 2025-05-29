// src/user/user.service.ts
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { KeyStoreService } from '../db/key-store.service';
import { StreamingProducerService } from '../streaming/streaming.producer.service';
import { StreamingEvent, StreamName } from '../constants/streaming.constants';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly keyStore: KeyStoreService,
    private readonly producer: StreamingProducerService,
  ) {}

  async getKeyInfo(key: string) {
    const logKey = `getKeyInfo:`
    const data = await this.keyStore.getAccessKey(key).catch(error => {
      this.logger.error(`${logKey} keyStore.getAccessKey failed with error:`, error.stack, key);
      throw new InternalServerErrorException(`Failed to get key info`);
    })
    if (!data) throw new NotFoundException('Invalid key');
    return data;
  }

  async disableKey(key: string) {
    const logKey = `disableKey:`
    const data = await this.keyStore.getAccessKey(key).catch(error => {
      this.logger.error(`${logKey} keyStore.getAccessKey failed with error:`, error.stack, key);
      throw new InternalServerErrorException(`Failed to disable key`);
    })
    if (!data) throw new NotFoundException('404: Key not found');
    if(!data.enabled)
        return { message : `Key already disabled`}

    // update in db
    data.enabled = false;
    await this.keyStore.setAccessKey(key, data).catch(error => {
      this.logger.error(`${logKey} keyStore.setAccessKey failed with error:`, error.stack, key);
      throw new InternalServerErrorException(`Failed to disable key`);
    });

    // publish to streams
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
      event: StreamingEvent.KEY_UPDATED,
      key,
      ...data,
    }).catch(error => {
      this.logger.error(`${logKey} producer.publish failed with error`, error.stack, key);
      // revert the previous action in db
      data.enabled = true;
      this.keyStore.setAccessKey(key, data).catch(error => {
        this.logger.error(`${logKey} keyStore.setAccessKey(in 2nd catch) failed with error:`, error.stack, key);
      });
      throw new InternalServerErrorException(`Failed to disable key`);
    });

    return { message: 'Key disabled' };
  }
}

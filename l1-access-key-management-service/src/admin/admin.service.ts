// src/admin/admin.service.ts
import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { KeyStoreService } from '../db/key-store.service';
import { StreamingProducerService } from '../streaming/streaming.producer.service';
import { StreamingEvent, StreamName } from '../constants/streaming.constants';
import { CreateKeyDto } from './dto/create-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    private readonly keyStore: KeyStoreService,
    private readonly producer: StreamingProducerService,
  ) {}

  async createKey(payload: CreateKeyDto) {
    const logKey = `createKey:`
    const key = payload.key;

    const existing = await this.keyStore.getAccessKey(key).catch(error => {
      this.logger.error(`${logKey} keyStore.getAccessKey failed with error`, error.stack, payload);
      throw new InternalServerErrorException('Failed to create access key');
    })
    if (existing) throw new ConflictException('Key already exists');

    // set data in db
    await this.keyStore.setAccessKey(key, {...payload, enabled : true}).catch(error => {
      this.logger.error(`${logKey} Failed to set access key`, error.stack, payload);
      throw new InternalServerErrorException('Failed to create access key');
    })

    // publish msg to streams
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
      event: StreamingEvent.KEY_CREATED,
      ...payload,
      enabled : true
    }).catch(async error => {
      this.logger.error(`${logKey} Failed to stream access key`, error.stack, payload);

      // revert the previous action in db
      await this.keyStore.deleteAccessKey(key).catch(err => {
        this.logger.error(`${logKey} Failed to revert create action`, error.stack, payload);
      });

      throw new InternalServerErrorException(`Failed to create access key`);
    });

    //return to client
    return { message: 'Key created' };
  }

  async getKey(key: string) {
    return await this.keyStore.getAccessKey(key);
  }

  async listKeys() {
    // You need to keep track of all keys in a list key like "access-keys:list"
    const keys = await this.keyStore.getAllAccessKeys();
    return keys || [];
  }

  async updateKey(key: string, newData: UpdateKeyDto) {
    const logKey = `updateKey:`

    // fetch existing data for the key from db
    const existing = await this.keyStore.getAccessKey(key).catch(error => {
      this.logger.error(`${logKey} keyStore.getAccessKey failed with error:`, error.stack, key, newData);
      throw new InternalServerErrorException(`Failed to update data`);
    })
    if (!existing) throw new NotFoundException('Key not found');

    // set data in database
    const updated = { ...existing, ...newData };
    await this.keyStore.setAccessKey(key, updated).catch(error => {
      this.logger.error(`${logKey} keyStore.setAccessKey failed with error:`, error.stack, key, newData);
      throw new InternalServerErrorException(`Failed to update data`);
    });

    // send data through streams to L2
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
      event: StreamingEvent.KEY_UPDATED,
      key,
      ...updated,
    }).catch(error => {
      this.logger.error(`${logKey} producer.publish failed with error`, error.stack, key, newData);
      // revert the previous action in db
      this.keyStore.setAccessKey(key, existing).catch(error => {
        this.logger.error(`${logKey} keyStore.setAccessKey(inside 2nd catch) failed with error:`, error.stack, key, newData);
      });
      throw new InternalServerErrorException(`Failed to update data`);
    });

    return { message: 'Key updated' };
  }

  async deleteKey(key: string) {
    const logKey = `deleteKey:`

    const existing = await this.keyStore.getAccessKey(key).catch(error => {
      this.logger.error(`${logKey} keyStore.getAccessKey failed with error:`, error.stack, key);
      throw new InternalServerErrorException(`Failed to delete key`);
    })

    if (!existing) throw new NotFoundException('Key not found');

    // delete key from db
    await this.keyStore.deleteAccessKey(key).catch(error => {
      this.logger.error(`${logKey} keyStore.deleteAccessKey failed with error:`, error.stack, key);
      throw new InternalServerErrorException(`Failed to delete key`);
    });

    // publish to stream
    await this.producer.publish(StreamName.ACCESS_KEY_EVENTS, {
      event: StreamingEvent.KEY_DELETED,
      key,
    }).catch(error => {
      this.logger.error(`${logKey} producer.publish failed with error`, error.stack, key);
      // revert the previous action in db
      this.keyStore.setAccessKey(key, existing).catch(error => {
        this.logger.error(`${logKey} keyStore.setAccessKey failed with error:`, error.stack, key);
      });
      throw new InternalServerErrorException(`Failed to delete key`);
    })
    
    return { message: 'Key deleted' };
  }
}

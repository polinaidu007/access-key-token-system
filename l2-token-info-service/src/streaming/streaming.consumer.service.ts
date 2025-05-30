// src/streaming/streaming.consumer.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

import { STREAM_CLIENT } from './streaming.client.provider';
import { Inject } from '@nestjs/common';
import { StreamingEvent, StreamName } from 'src/constants/streaming.constants';
import { AccessKeyDbService } from 'src/db/access-key.service';
import { KeyStreamDto } from './dto/key-stream.dto';

@Injectable()
export class StreamingConsumerService implements OnModuleInit {
    private readonly logger = new Logger(StreamingConsumerService.name);
    private readonly stream = StreamName.ACCESS_KEY_EVENTS;
    private readonly group = 'l2-consumer-group';
    private readonly consumer = `consumer-${Math.random().toString(36).slice(2, 8)}`;

    constructor(
        @Inject(STREAM_CLIENT) private readonly redis: Redis,
        private readonly accessKeyDbService: AccessKeyDbService,
    ) { }

    async onModuleInit() {
        await this.setupConsumerGroup();
        this.pollStream();
    }

    private async setupConsumerGroup() {
        try {
            await this.redis.xgroup('CREATE', this.stream, this.group, '$', 'MKSTREAM');
            this.logger.log(`Consumer group '${this.group}' created`);
        } catch (err) {
            if (!err.message.includes('BUSYGROUP')) {
                this.logger.error('Error creating consumer group:', err);
                throw err;
            }
            this.logger.log(`Consumer group '${this.group}' already exists`);
        }
    }

    private async pollStream() {
        while (true) {
            try {
                const res = await (this.redis as any).xreadgroup(
                    'GROUP',
                    this.group,
                    this.consumer,
                    'BLOCK',
                    5000,
                    'COUNT',
                    10,
                    'STREAMS',
                    this.stream,
                    '>',
                );

                if (res) {
                    for (const [, entries] of res) {
                        for (const [id, fields] of entries) {
                            const data = this.parse(fields);
                            this.logger.debug(`Received message [${id}]: ${JSON.stringify(data)}`);

                            await this.processMessage(data);
                            await this.redis.xack(this.stream, this.group, id);
                        }
                    }
                }
            } catch (err) {
                this.logger.error('Error reading from stream:', err.message);
            }
        }
    }

    private parse(fields: string[]): KeyStreamDto {
        const obj: KeyStreamDto = new KeyStreamDto();
        for (let i = 0; i < fields.length; i += 2) {
            obj[fields[i]] = fields[i + 1];
        }
        return obj;
    }

    private async processMessage(data: KeyStreamDto) {
        const { event, key, ...rest } = data;

        switch (event) {

            case StreamingEvent.KEY_UPDATED:
            case StreamingEvent.KEY_CREATED:
                await this.accessKeyDbService.setAccessKey(key, {
                    enabled : rest.enabled === 'true',
                    expiresAt : Number(rest.expiresAt),
                    rateLimitPerMin : Number(rest.rateLimitPerMin)
                });
                this.logger.log(`Access key '${key}' created`);
                break;

            case StreamingEvent.KEY_DELETED:
                await this.accessKeyDbService.deleteAccessKey(key);
                this.logger.log(`Access key '${key}' deleted from cache`);
                break;

            default:
                this.logger.warn(`Unhandled event type: ${event}`);
        }
    }
}

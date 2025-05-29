// src/streaming/streaming.service.ts
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { STREAM_CLIENT } from './streaming.client.provider';
import { KeyStreamDto } from './dto/key-stream.dto';
import { StreamingEvent, StreamName } from 'src/constants/streaming.constants';

@Injectable()
export class StreamingProducerService {
  constructor(
    @Inject(STREAM_CLIENT)
    private readonly streamClient: Redis,
  ) {}

  async publish(stream: StreamName, data: KeyStreamDto) {
    const flat = Object.entries(data).flat();
    return this.streamClient.xadd(stream, '*', ...flat);
  }
}

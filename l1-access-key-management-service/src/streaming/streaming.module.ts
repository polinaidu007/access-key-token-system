// src/streaming/streaming.module.ts
import { Module } from '@nestjs/common';
import { StreamingProducerService } from './streaming.producer.service';
import { StreamingClientProvider } from './streaming.client.provider';

@Module({
  providers: [StreamingProducerService, StreamingClientProvider],
  exports: [StreamingProducerService],
})
export class StreamingModule {}

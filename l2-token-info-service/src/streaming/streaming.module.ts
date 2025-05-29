// src/streaming/streaming.module.ts
import { Module } from '@nestjs/common';
import { StreamingClientProvider } from './streaming.client.provider';
import { StreamingConsumerService } from './streaming.consumer.service';
import { DbModule } from 'src/db/db.module';

@Module({
  imports : [DbModule],
  providers: [StreamingClientProvider, StreamingConsumerService],
  exports: [],
})
export class StreamingModule {}

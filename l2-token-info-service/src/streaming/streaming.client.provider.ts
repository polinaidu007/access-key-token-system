// streaming/streaming.client.provider.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const STREAM_CLIENT = 'STREAM_CLIENT';

export const StreamingClientProvider: Provider = {
  provide: STREAM_CLIENT,
  useFactory: () => {
    return new Redis({
      host: process.env.MQ_HOST,
      port: Number(process.env.MQ_PORT),
    });
  },
};

// db/db.client.provider.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const DB_CLIENT = 'DB_CLIENT';

export const DbClientProvider: Provider = {
  provide: DB_CLIENT,
  useFactory: () => {
    return new Redis({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      db: Number(process.env.DB_NUMBER), // use logical DB 1
    });
  },
};

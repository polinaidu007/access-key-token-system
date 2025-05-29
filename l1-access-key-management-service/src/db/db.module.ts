// db/db.module.ts
import { Module } from '@nestjs/common';
import { DbClientProvider } from './db.client.provider';
import { KeyStoreService } from './key-store.service';

@Module({
  providers: [DbClientProvider, KeyStoreService],
  exports: [KeyStoreService],
})
export class DbModule {}

// db/db.module.ts
import { Module } from '@nestjs/common';
import { DbClientProvider } from './db.client.provider';
import { AccessKeyDbService } from './access-key.service';

@Module({
  providers: [DbClientProvider, AccessKeyDbService],
  exports: [AccessKeyDbService],
})
export class DbModule {}

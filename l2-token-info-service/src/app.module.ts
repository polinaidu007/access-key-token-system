import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { TokenController } from './token/token.controller';
import { TokenService } from './token/token.service';
import { ConfigModule } from '@nestjs/config';
import { StreamingModule } from './streaming/streaming.module';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true, // makes it available app-wide
  }), 
    DbModule,
    StreamingModule
  ],
  controllers: [AppController, TokenController],
  providers: [AppService, TokenService],
})
export class AppModule {}

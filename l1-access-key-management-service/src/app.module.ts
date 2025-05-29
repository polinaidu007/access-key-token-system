import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminController } from './admin/admin.controller';
import { UserController } from './user/user.controller';
import { AdminService } from './admin/admin.service';
import { UserService } from './user/user.service';
import { StreamingModule } from './streaming/streaming.module';
import { DbModule } from './db/db.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
    isGlobal: true, // makes it available app-wide
  }), 
  StreamingModule, DbModule],
  controllers: [AppController, AdminController, UserController],
  providers: [AppService, AdminService, UserService],
})
export class AppModule { }

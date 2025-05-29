import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminController } from './admin/admin.controller';
import { UserController } from './user/user.controller';
import { AdminService } from './admin/admin.service';
import { UserService } from './user/user.service';

@Module({
  imports: [],
  controllers: [AppController, AdminController, UserController],
  providers: [AppService, AdminService, UserService],
})
export class AppModule {}

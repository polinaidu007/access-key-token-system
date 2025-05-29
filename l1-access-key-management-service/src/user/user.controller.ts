import { Controller, Get, Headers, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('key-info')
  @ApiOperation({ summary: 'Get API key info' })
  @ApiHeader({ name: 'x-api-key', required: true })
  getKeyInfo(@Headers('x-api-key') key: string) {
    return this.userService.getKeyInfo(key);
  }

  @Put('disable-key')
  @ApiOperation({ summary: 'Disable an API key' })
  @ApiHeader({ name: 'x-api-key', required: true })
  disableKey(@Headers('x-api-key') key: string) {
    return this.userService.disableKey(key);
  }
}

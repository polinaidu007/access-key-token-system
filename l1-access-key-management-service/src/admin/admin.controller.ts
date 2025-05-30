import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateKeyDto } from './dto/create-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('key')
  @ApiOperation({ summary: 'Create a new access key' })
  @ApiResponse({ status: 201, description: 'Key created' })
  createKey(@Body() body: CreateKeyDto) {
    return this.adminService.createKey(body);
  }

  // @Get('key/:id')
  // @ApiOperation({ summary: 'Get key by ID' })
  // getKey(@Param('id') key: string) {
  //   return this.adminService.getKey(key);
  // }

  @Get('keys')
  @ApiOperation({ summary: 'List all keys' })
  listKeys() {
    return this.adminService.listKeys();
  }

  @Put('key/:id')
  @ApiOperation({ summary: 'Update existing key' })
  updateKey(@Param('id') key: string, @Body() body: UpdateKeyDto) {
    return this.adminService.updateKey(key, body);
  }

  @Delete('key/:id')
  @ApiOperation({ summary: 'Delete key by ID' })
  deleteKey(@Param('id') key: string) {
    return this.adminService.deleteKey(key);
  }
}

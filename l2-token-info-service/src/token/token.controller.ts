import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TokenService } from './token.service';
import { AccessKeyGuard } from 'src/common/guards/access-key.guard';

@ApiTags('token')
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get()
  @UseGuards(AccessKeyGuard)
  @ApiOperation({ summary: 'Get tokenInfo by tokenId (key validated by guard)' })
  @ApiQuery({ name: 'tokenId', required: true })
  @ApiBearerAuth()
  async validate(@Query('tokenId') tokenId: string) {
    return await this.tokenService.getTokenInfo(tokenId)
  }
}

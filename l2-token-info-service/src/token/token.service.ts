// src/token/token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessKeyDbService } from 'src/db/access-key.service';
import { StrategyFactory } from './token-info/strategy.factory';
import { PlatformName } from './enum/platformName.enum';

@Injectable()
export class TokenService {
  constructor(private readonly accessKeyDbService: AccessKeyDbService, private strategyFactory : StrategyFactory) {}

  async getTokenInfo(coinName: string, platform : PlatformName): Promise<string> {
    const strategy = this.strategyFactory.getTokenStrategy(platform);
    return strategy.getTokenInfo(coinName);
  }
}

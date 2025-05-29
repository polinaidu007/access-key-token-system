// src/token/token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessKeyDbService } from 'src/db/access-key.service';

@Injectable()
export class TokenService {
  constructor(private readonly accessKeyDbService: AccessKeyDbService) {}

  async getTokenInfo(tokenId: string): Promise<{message : string}> {
    return {
        message : `Request successful. TokenId=${tokenId}`
    }
  }
}

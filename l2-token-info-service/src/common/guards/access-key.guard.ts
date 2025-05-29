// src/common/guards/access-key.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject
} from '@nestjs/common';
import { Request } from 'express';
import { AccessKeyDbService } from 'src/db/access-key.service';

@Injectable()
export class AccessKeyGuard implements CanActivate {
  constructor(
    private readonly accessKeyDbService: AccessKeyDbService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const key = authHeader.replace('Bearer ', '').trim();
    const record = await this.accessKeyDbService.getAccessKey(key);

    if (!record) {
        throw new UnauthorizedException('Key not found')
    }
    if (!record.enabled) {
        throw new UnauthorizedException('Key is disabled');
    }

    if (!record.expiresAt || record.expiresAt < Date.now()) {
      throw new UnauthorizedException('Key is expired');
    }

    if(!record.rateLimitPerMin || !(await this.accessKeyDbService.isWithinRateLimit(key, record.rateLimitPerMin))) {
        throw new UnauthorizedException('Rate limit exceeded for this key');
    }

    return true;
  }
}

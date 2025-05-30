// src/common/guards/access-key.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
    Logger
} from '@nestjs/common';
import { Request } from 'express';
import { AccessKeyDbService } from 'src/db/access-key.service';

@Injectable()
export class AccessKeyGuard implements CanActivate {

    private readonly logger = new Logger(AccessKeyGuard.name);
    constructor(
        private readonly accessKeyDbService: AccessKeyDbService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const logKey = `canActivate:`;
        const request = context.switchToHttp().getRequest<Request>();
        const authHeader = request.headers.authorization;
        const logRequestDetails = JSON.stringify({
            url: request.url,
            body: request.body,
            query: request.query,
            authorization: request.headers.authorization,
        });

        this.logger.debug(`${logKey} req info:`, logRequestDetails);

        if (!authHeader?.startsWith('Bearer ')) {
            this.logger.error(`${logKey} no bearer token`, logRequestDetails);
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const key = authHeader.replace('Bearer ', '').trim();


        const record = await this.accessKeyDbService.getAccessKey(key).catch(error => {
            this.logger.error(`${logKey} accessKeyDbService.getAccessKey failed`, error.stack, logRequestDetails);
            throw new UnauthorizedException('Error validating key');
        });

        if (!record) {
            this.logger.error(`${logKey} key not found`, logRequestDetails);
            throw new UnauthorizedException('Key not found');
        }

        if (!record.enabled) {
            this.logger.error(`${logKey} key is disabled`, logRequestDetails);
            throw new UnauthorizedException('Key is disabled');
        }

        if (!record.expiresAt || record.expiresAt < Date.now()) {
            this.logger.error(`${logKey} key is expired`, logRequestDetails);
            throw new UnauthorizedException('Key is expired');
        }

        if (!record.rateLimitPerMin) {
            this.logger.error(`${logKey} rateLimitPerMin do not exist on db record`, logRequestDetails);
            throw new UnauthorizedException('Rate limit check failed');
        }

        const withinLimit = await this.accessKeyDbService.isWithinRateLimit(key, record.rateLimitPerMin).catch(error => {
            this.logger.error(`${logKey} isWithinRateLimit failed`, error.stack, logRequestDetails);
            throw new UnauthorizedException('Rate limit check failed');
        });

        if (!withinLimit) {
            this.logger.error(`${logKey} rate limit exceeded`, logRequestDetails);
            throw new UnauthorizedException('Rate limit exceeded for this key');
        }

        this.logger.debug(`${logKey} Valid req:`, logRequestDetails);

        return true;
    }
}

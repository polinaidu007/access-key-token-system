export class KeyStreamDto {
    event : string;
    key: string;
    rateLimitPerMin ?: number;
    expiresAt?: number;
    enabled ?: boolean;
}
export class KeyRecordDto {
  key: string;
  rateLimitPerMin: number;
  expiresAt?: number;
  enabled ?: boolean;
}

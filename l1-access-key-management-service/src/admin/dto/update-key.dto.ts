import { ApiProperty } from '@nestjs/swagger';

export class UpdateKeyDto {
  @ApiProperty({ required: false })
  rateLimitPerMin?: number;

  @ApiProperty({ required: false })
  expiresAt?: number;
}

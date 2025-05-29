import { ApiProperty } from '@nestjs/swagger';

export class CreateKeyDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  rateLimitPerMin: number;

  @ApiProperty({ required: false })
  expiresAt?: number;
}

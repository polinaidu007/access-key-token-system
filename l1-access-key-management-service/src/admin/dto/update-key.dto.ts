import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class UpdateKeyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rateLimitPerMin?: number;

  @ApiProperty({ required: false, description: 'Epoch timestamp in milliseconds or seconds' })
  @IsOptional()
  @IsInt()
  @Min(0)
  expiresAt?: number;
}
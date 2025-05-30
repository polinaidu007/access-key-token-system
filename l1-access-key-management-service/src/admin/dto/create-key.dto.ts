import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class CreateKeyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  rateLimitPerMin: number;

  @ApiProperty({ required: false, description: 'Epoch timestamp in milliseconds or seconds' })
  @IsInt()
  @Min(0)
  expiresAt: number;
}

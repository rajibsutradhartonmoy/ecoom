import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'plan-uuid' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ enum: ['MONTHLY', 'YEARLY'], default: 'MONTHLY' })
  @IsOptional()
  @IsEnum(['MONTHLY', 'YEARLY'])
  billingCycle?: 'MONTHLY' | 'YEARLY';
}

import { IsString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'starter' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Starter Plan' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ example: 'Perfect for small businesses' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Min(0)
  priceYearly: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  maxProducts: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(1)
  maxOrders: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  maxStorage: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  maxStaff: number;

  @ApiProperty({ example: ['custom_domain', 'analytics', 'priority_support'] })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  trialDays?: number;
}

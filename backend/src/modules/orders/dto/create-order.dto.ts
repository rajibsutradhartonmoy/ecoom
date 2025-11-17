import { IsString, IsArray, IsNumber, IsOptional, ValidateNested, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class OrderItemDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

class ShippingAddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  @MinLength(1)
  line1: string;

  @ApiPropertyOptional({ example: 'Apt 4B' })
  @IsString()
  @IsOptional()
  line2?: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @MinLength(1)
  city: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  @MinLength(1)
  state: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @MinLength(1)
  postalCode: string;

  @ApiProperty({ example: 'US' })
  @IsString()
  @MinLength(2)
  country: string;
}

class CustomerInfoDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: CustomerInfoDto })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer: CustomerInfoDto;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ example: 'Please leave at door' })
  @IsString()
  @IsOptional()
  notes?: string;
}

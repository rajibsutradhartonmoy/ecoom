import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
import { RbacGuard } from '@/common/guards/rbac.guard';
import { RequireRoles, RequirePermissions } from '@/common/decorators';
import { CurrentTenant } from '@/common/decorators';

@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('coupons')
@UseGuards(RbacGuard)
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  @RequirePermissions('coupon:read')
  @ApiOperation({ summary: 'Get all coupons for tenant' })
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.couponsService.findAll(tenantId, {
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get(':id')
  @RequirePermissions('coupon:read')
  @ApiOperation({ summary: 'Get coupon by ID' })
  async findById(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.couponsService.findById(tenantId, id);
  }

  @Post()
  @RequirePermissions('coupon:create')
  @ApiOperation({ summary: 'Create a new coupon' })
  async create(@CurrentTenant('id') tenantId: string, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(tenantId, {
      ...dto,
      startsAt: new Date(dto.startsAt),
      expiresAt: new Date(dto.expiresAt),
    });
  }

  @Put(':id')
  @RequirePermissions('coupon:update')
  @ApiOperation({ summary: 'Update a coupon' })
  async update(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto
  ) {
    const data: any = { ...dto };
    if (dto.startsAt) data.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    return this.couponsService.update(tenantId, id, data);
  }

  @Delete(':id')
  @RequirePermissions('coupon:delete')
  @ApiOperation({ summary: 'Delete a coupon' })
  async delete(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.couponsService.delete(tenantId, id);
  }

  @Post('validate')
  @RequirePermissions('coupon:read')
  @ApiOperation({ summary: 'Validate a coupon code' })
  async validate(@CurrentTenant('id') tenantId: string, @Body() dto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(tenantId, dto.code, dto.orderTotal);
  }
}

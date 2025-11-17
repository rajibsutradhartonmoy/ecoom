import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { RbacGuard } from '@/common/guards/rbac.guard';
import { RequirePermissions } from '@/common/decorators';
import { CurrentTenant } from '@/common/decorators';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(RbacGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customer:read')
  @ApiOperation({ summary: 'Get all customers for tenant' })
  async findAll(
    @CurrentTenant('id') tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.customersService.findAll(tenantId, {
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('stats')
  @RequirePermissions('customer:read')
  @ApiOperation({ summary: 'Get customer statistics' })
  async getStats(@CurrentTenant('id') tenantId: string) {
    return this.customersService.getStats(tenantId);
  }

  @Get(':id')
  @RequirePermissions('customer:read')
  @ApiOperation({ summary: 'Get customer by ID' })
  async findById(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.customersService.findById(tenantId, id);
  }
}

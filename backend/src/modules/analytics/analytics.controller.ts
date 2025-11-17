import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RbacGuard } from '@/common/guards/rbac.guard';
import { RequireRoles } from '@/common/decorators';
import { CurrentTenant } from '@/common/decorators';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(RbacGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(@CurrentTenant('id') tenantId: string) {
    return this.analyticsService.getDashboardStats(tenantId);
  }

  @Get('revenue-chart')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get revenue chart data' })
  async getRevenueChart(
    @CurrentTenant('id') tenantId: string,
    @Query('days') days?: string
  ) {
    return this.analyticsService.getRevenueChart(tenantId, days ? parseInt(days) : 30);
  }

  @Get('order-status')
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get order status distribution' })
  async getOrderStatusDistribution(@CurrentTenant('id') tenantId: string) {
    return this.analyticsService.getOrderStatusDistribution(tenantId);
  }
}

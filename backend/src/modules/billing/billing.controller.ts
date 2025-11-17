import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreatePlanDto, UpdatePlanDto, CreateCheckoutDto } from './dto';
import { RbacGuard } from '@/common/guards/rbac.guard';
import { RequireRoles, RequirePermissions } from '@/common/decorators';
import { CurrentTenant, CurrentUser } from '@/common/decorators';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  // ===== PUBLIC ENDPOINTS =====

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all public subscription plans' })
  async getPublicPlans() {
    return this.billingService.getPublicPlans();
  }

  @Public()
  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan details' })
  async getPlanById(@Param('id') id: string) {
    return this.billingService.getPlanById(id);
  }

  // ===== ADMIN ENDPOINTS (Super Admin Only) =====

  @ApiBearerAuth()
  @Get('admin/plans')
  @UseGuards(RbacGuard)
  @RequireRoles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all subscription plans (admin)' })
  async getAllPlans() {
    return this.billingService.getAllPlans();
  }

  @ApiBearerAuth()
  @Post('admin/plans')
  @UseGuards(RbacGuard)
  @RequireRoles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.billingService.createPlan(dto);
  }

  @ApiBearerAuth()
  @Put('admin/plans/:id')
  @UseGuards(RbacGuard)
  @RequireRoles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a subscription plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.billingService.updatePlan(id, dto);
  }

  // ===== TENANT ENDPOINTS =====

  @ApiBearerAuth()
  @Get('subscription')
  @UseGuards(RbacGuard)
  @RequireRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get current tenant subscription' })
  async getSubscription(@CurrentTenant('id') tenantId: string) {
    return this.billingService.getTenantSubscription(tenantId);
  }

  @ApiBearerAuth()
  @Get('usage')
  @UseGuards(RbacGuard)
  @RequireRoles('OWNER', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Check current plan usage and limits' })
  async checkUsage(@CurrentTenant('id') tenantId: string) {
    return this.billingService.checkPlanLimits(tenantId);
  }

  @ApiBearerAuth()
  @Post('checkout')
  @UseGuards(RbacGuard)
  @RequireRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  async createCheckout(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: CreateCheckoutDto
  ) {
    return this.billingService.createCheckoutSession(
      tenantId,
      dto.planId,
      dto.billingCycle as any
    );
  }

  @ApiBearerAuth()
  @Post('portal')
  @UseGuards(RbacGuard)
  @RequireRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a Stripe billing portal session' })
  async createPortal(@CurrentTenant('id') tenantId: string) {
    return this.billingService.createBillingPortalSession(tenantId);
  }

  @ApiBearerAuth()
  @Post('cancel')
  @UseGuards(RbacGuard)
  @RequireRoles('OWNER')
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  async cancelSubscription(@CurrentTenant('id') tenantId: string) {
    return this.billingService.cancelSubscription(tenantId, true);
  }

  @ApiBearerAuth()
  @Post('resume')
  @UseGuards(RbacGuard)
  @RequireRoles('OWNER')
  @ApiOperation({ summary: 'Resume canceled subscription' })
  async resumeSubscription(@CurrentTenant('id') tenantId: string) {
    return this.billingService.resumeSubscription(tenantId);
  }

  @ApiBearerAuth()
  @Get('invoices')
  @UseGuards(RbacGuard)
  @RequireRoles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get tenant invoices' })
  async getInvoices(@CurrentTenant('id') tenantId: string) {
    return this.billingService.getTenantInvoices(tenantId);
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/lib/db/prisma.service';
import { StripeService } from './stripe.service';
import { BillingCycle, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService
  ) {}

  // ===== SUBSCRIPTION PLANS =====

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPublicPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlanById(planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async createPlan(data: {
    name: string;
    displayName: string;
    description?: string;
    priceMonthly: number;
    priceYearly: number;
    maxProducts: number;
    maxOrders: number;
    maxStorage: number;
    maxStaff: number;
    features: string[];
    trialDays?: number;
  }) {
    // Create product in Stripe
    const stripeProduct = await this.stripeService.createProduct({
      name: data.displayName,
      description: data.description,
      metadata: { planName: data.name },
    });

    // Create monthly price
    const monthlyPrice = await this.stripeService.createPrice({
      productId: stripeProduct.id,
      unitAmount: Math.round(data.priceMonthly * 100), // Convert to cents
      currency: 'usd',
      interval: 'month',
    });

    // Create yearly price
    const yearlyPrice = await this.stripeService.createPrice({
      productId: stripeProduct.id,
      unitAmount: Math.round(data.priceYearly * 100),
      currency: 'usd',
      interval: 'year',
    });

    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        stripePriceId: monthlyPrice.id, // Default to monthly
        stripeProductId: stripeProduct.id,
        maxProducts: data.maxProducts,
        maxOrders: data.maxOrders,
        maxStorage: data.maxStorage,
        maxStaff: data.maxStaff,
        features: data.features,
        trialDays: data.trialDays || 14,
      },
    });
  }

  async updatePlan(
    planId: string,
    data: {
      displayName?: string;
      description?: string;
      maxProducts?: number;
      maxOrders?: number;
      maxStorage?: number;
      maxStaff?: number;
      features?: string[];
      isActive?: boolean;
      isPublic?: boolean;
      sortOrder?: number;
    }
  ) {
    const plan = await this.getPlanById(planId);

    // Update Stripe product if name changed
    if (data.displayName && plan.stripeProductId) {
      await this.stripeService.getClient().products.update(plan.stripeProductId, {
        name: data.displayName,
        description: data.description,
      });
    }

    return this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data,
    });
  }

  // ===== TENANT SUBSCRIPTIONS =====

  async getTenantSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async createTenantSubscription(tenantId: string, planId: string, billingCycle: BillingCycle = 'MONTHLY') {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true, users: { include: { user: true }, take: 1 } },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant.subscription) {
      throw new BadRequestException('Tenant already has a subscription');
    }

    const plan = await this.getPlanById(planId);

    // Create Stripe customer if not exists
    let stripeCustomerId = tenant.stripeCustomerId;
    if (!stripeCustomerId) {
      const ownerUser = tenant.users[0]?.user;
      const customer = await this.stripeService.createCustomer({
        email: ownerUser?.email || `tenant-${tenantId}@example.com`,
        name: tenant.name,
        metadata: { tenantId },
      });
      stripeCustomerId = customer.id;

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId },
      });
    }

    // Create subscription with trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + plan.trialDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        planId,
        stripeCustomerId,
        status: 'TRIALING',
        billingCycle,
        trialStartsAt: new Date(),
        trialEndsAt,
      },
      include: { plan: true },
    });

    // Update tenant subscription info
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionTier: plan.name as any,
        subscriptionStatus: 'TRIALING',
        trialEndsAt,
      },
    });

    return subscription;
  }

  async createCheckoutSession(tenantId: string, planId: string, billingCycle: BillingCycle = 'MONTHLY') {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const plan = await this.getPlanById(planId);

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('Tenant does not have a Stripe customer ID');
    }

    if (!plan.stripePriceId) {
      throw new BadRequestException('Plan does not have a Stripe price ID');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await this.stripeService.createCheckoutSession({
      customerId: tenant.stripeCustomerId,
      priceId: plan.stripePriceId,
      successUrl: `${baseUrl}/dashboard/tenant/billing?success=true`,
      cancelUrl: `${baseUrl}/dashboard/tenant/billing?canceled=true`,
      trialDays: tenant.subscription ? 0 : plan.trialDays,
      metadata: {
        tenantId,
        planId,
        billingCycle,
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async createBillingPortalSession(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('Tenant does not have a Stripe customer ID');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await this.stripeService.createBillingPortalSession({
      customerId: tenant.stripeCustomerId,
      returnUrl: `${baseUrl}/dashboard/tenant/billing`,
    });

    return { url: session.url };
  }

  async cancelSubscription(tenantId: string, cancelAtPeriodEnd: boolean = true) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.stripeSubscriptionId) {
      await this.stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        cancelAtPeriodEnd
      );
    }

    const updateData: any = {
      canceledAt: new Date(),
    };

    if (!cancelAtPeriodEnd) {
      updateData.status = 'CANCELED';
      updateData.endedAt = new Date();
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: updateData,
    });
  }

  async resumeSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.canceledAt) {
      throw new BadRequestException('Subscription is not canceled');
    }

    if (subscription.stripeSubscriptionId) {
      await this.stripeService.resumeSubscription(subscription.stripeSubscriptionId);
    }

    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        canceledAt: null,
      },
    });
  }

  // ===== USAGE TRACKING =====

  async checkPlanLimits(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!subscription) {
      // Default free plan limits
      return {
        canCreateProduct: true,
        canCreateOrder: true,
        remainingProducts: 10,
        remainingOrders: 100,
      };
    }

    const plan = subscription.plan;

    // Count current usage
    const productCount = await this.prisma.product.count({
      where: { tenantId },
    });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const orderCount = await this.prisma.order.count({
      where: {
        tenantId,
        createdAt: { gte: currentMonth },
      },
    });

    return {
      canCreateProduct: productCount < plan.maxProducts,
      canCreateOrder: orderCount < plan.maxOrders,
      remainingProducts: Math.max(0, plan.maxProducts - productCount),
      remainingOrders: Math.max(0, plan.maxOrders - orderCount),
      currentUsage: {
        products: productCount,
        orders: orderCount,
      },
      limits: {
        maxProducts: plan.maxProducts,
        maxOrders: plan.maxOrders,
        maxStorage: plan.maxStorage,
        maxStaff: plan.maxStaff,
      },
    };
  }

  async recordUsage(tenantId: string, metricName: string, quantity: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return;
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return this.prisma.usageRecord.create({
      data: {
        subscriptionId: subscription.id,
        metricName,
        quantity,
        periodStart,
        periodEnd,
      },
    });
  }

  // ===== INVOICES =====

  async getTenantInvoices(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!subscription) {
      return [];
    }

    return this.prisma.invoice.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}

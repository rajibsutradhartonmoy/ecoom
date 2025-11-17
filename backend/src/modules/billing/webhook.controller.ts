import { Controller, Post, Req, Headers, RawBodyRequest, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '@/lib/db/prisma.service';
import { StripeService } from './stripe.service';
import { Public } from '@/common/decorators/public.decorator';
import Stripe from 'stripe';

@ApiExcludeController()
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService
  ) {}

  @Public()
  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET not configured');
      return { received: true };
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.constructWebhookEvent(
        req.rawBody as Buffer,
        signature,
        webhookSecret
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw err;
    }

    // Check if we've already processed this event
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existingEvent?.processed) {
      return { received: true, message: 'Event already processed' };
    }

    // Store the event
    const webhookEvent = await this.prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      create: {
        stripeEventId: event.id,
        type: event.type,
        payload: event.data.object as any,
      },
      update: {},
    });

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          error: error.message,
        },
      });
      throw error;
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    const planId = session.metadata?.planId;
    const billingCycle = session.metadata?.billingCycle || 'MONTHLY';

    if (!tenantId || !planId) {
      this.logger.error('Missing metadata in checkout session');
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (subscription) {
      // Update existing subscription
      await this.prisma.subscription.update({
        where: { tenantId },
        data: {
          planId,
          stripeSubscriptionId: session.subscription as string,
          billingCycle: billingCycle as any,
          status: 'ACTIVE',
        },
      });
    } else {
      // Create new subscription
      await this.prisma.subscription.create({
        data: {
          tenantId,
          planId,
          stripeSubscriptionId: session.subscription as string,
          stripeCustomerId: session.customer as string,
          billingCycle: billingCycle as any,
          status: 'ACTIVE',
        },
      });
    }

    // Update tenant
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (plan) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionTier: plan.name as any,
          subscriptionStatus: 'ACTIVE',
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found: ${stripeSubscription.id}`);
      return;
    }

    const statusMap: Record<string, any> = {
      active: 'ACTIVE',
      trialing: 'TRIALING',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      unpaid: 'UNPAID',
    };

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: statusMap[stripeSubscription.status] || 'ACTIVE',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
      },
    });

    // Update tenant status
    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        subscriptionStatus: statusMap[stripeSubscription.status] || 'ACTIVE',
      },
    });
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        endedAt: new Date(),
      },
    });

    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        subscriptionStatus: 'CANCELED',
      },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      return;
    }

    // Generate invoice number
    const invoiceCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    await this.prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        number: invoiceNumber,
        status: 'PAID',
        subtotal: (invoice.subtotal || 0) / 100,
        tax: (invoice.tax || 0) / 100,
        total: (invoice.total || 0) / 100,
        amountPaid: (invoice.amount_paid || 0) / 100,
        amountDue: 0,
        currency: invoice.currency,
        periodStart: new Date((invoice.period_start || 0) * 1000),
        periodEnd: new Date((invoice.period_end || 0) * 1000),
        dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : new Date(),
        paidAt: new Date(),
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        invoicePdf: invoice.invoice_pdf || undefined,
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
      },
    });

    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        subscriptionStatus: 'PAST_DUE',
      },
    });
  }
}

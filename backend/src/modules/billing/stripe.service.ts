import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured');
      return;
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    });
  }

  getClient(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe client not initialized. Please configure STRIPE_SECRET_KEY');
    }
    return this.stripe;
  }

  // Customer Management
  async createCustomer(params: {
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    return this.getClient().customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
  }

  async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams
  ): Promise<Stripe.Customer> {
    return this.getClient().customers.update(customerId, params);
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    const customer = await this.getClient().customers.retrieve(customerId);
    if (customer.deleted) {
      throw new Error('Customer has been deleted');
    }
    return customer as Stripe.Customer;
  }

  // Product & Price Management
  async createProduct(params: {
    name: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Product> {
    return this.getClient().products.create({
      name: params.name,
      description: params.description,
      metadata: params.metadata,
    });
  }

  async createPrice(params: {
    productId: string;
    unitAmount: number;
    currency: string;
    interval: 'month' | 'year';
    metadata?: Record<string, string>;
  }): Promise<Stripe.Price> {
    return this.getClient().prices.create({
      product: params.productId,
      unit_amount: params.unitAmount,
      currency: params.currency,
      recurring: {
        interval: params.interval,
      },
      metadata: params.metadata,
    });
  }

  // Subscription Management
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    };

    if (params.trialDays && params.trialDays > 0) {
      subscriptionParams.trial_period_days = params.trialDays;
    }

    return this.getClient().subscriptions.create(subscriptionParams);
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getClient().subscriptions.retrieve(subscriptionId);
  }

  async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams
  ): Promise<Stripe.Subscription> {
    return this.getClient().subscriptions.update(subscriptionId, params);
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Stripe.Subscription> {
    if (cancelAtPeriodEnd) {
      return this.getClient().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    return this.getClient().subscriptions.cancel(subscriptionId);
  }

  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.getClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  // Checkout Session
  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: params.customerId,
      mode: 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    };

    if (params.trialDays && params.trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: params.trialDays,
      };
    }

    return this.getClient().checkout.sessions.create(sessionParams);
  }

  // Billing Portal
  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    return this.getClient().billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });
  }

  // Invoice Management
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    return this.getClient().invoices.retrieve(invoiceId);
  }

  async listInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    const invoices = await this.getClient().invoices.list({
      customer: customerId,
      limit,
    });
    return invoices.data;
  }

  // Webhook Verification
  constructWebhookEvent(
    payload: Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    return this.getClient().webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

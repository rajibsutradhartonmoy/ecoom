import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { WebhookController } from './webhook.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';

@Module({
  controllers: [BillingController, WebhookController],
  providers: [BillingService, StripeService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}

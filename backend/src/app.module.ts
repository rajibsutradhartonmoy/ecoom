import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Core modules (will be implemented in phases)
// import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
// import { TenantsModule } from './modules/tenants/tenants.module';
// import { TenancyModule } from './modules/tenancy/tenancy.module';
// import { ProductsModule } from './modules/products/products.module';
// import { CategoriesModule } from './modules/categories/categories.module';
// import { OrdersModule } from './modules/orders/orders.module';
// import { CustomersModule } from './modules/customers/customers.module';
// import { CouponsModule } from './modules/coupons/coupons.module';
// import { ShippingModule } from './modules/shipping/shipping.module';
// import { TaxesModule } from './modules/taxes/taxes.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { BillingModule } from './modules/billing/billing.module';
// import { CheckoutModule } from './modules/checkout/checkout.module';
// import { EmailModule } from './modules/email/email.module';
// import { LoggerModule } from './modules/logger/logger.module';

// Lib modules
import { PrismaModule } from './lib/db/prisma.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Database
    PrismaModule,

    // Feature modules (will be uncommented as implemented)
    // AuthModule,
    // UsersModule,
    // TenantsModule,
    // TenancyModule,
    // ProductsModule,
    // CategoriesModule,
    // OrdersModule,
    // CustomersModule,
    // CouponsModule,
    // ShippingModule,
    // TaxesModule,
    // AnalyticsModule,
    // BillingModule,
    // CheckoutModule,
    // EmailModule,
    // LoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

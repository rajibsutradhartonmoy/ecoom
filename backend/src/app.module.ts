import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { AuthModule } from './modules/auth/auth.module';
// import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StoreModule } from './modules/store/store.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BillingModule } from './modules/billing/billing.module';

// Middleware
import { TenantResolutionMiddleware } from './common/middleware/tenant-resolution.middleware';
// import { CustomersModule } from './modules/customers/customers.module';
// import { CouponsModule } from './modules/coupons/coupons.module';
// import { ShippingModule } from './modules/shipping/shipping.module';
// import { TaxesModule } from './modules/taxes/taxes.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// import { CheckoutModule } from './modules/checkout/checkout.module';
// import { EmailModule } from './modules/email/email.module';
// import { LoggerModule } from './modules/logger/logger.module';

// Lib modules
import { PrismaModule } from './lib/db/prisma.module';

// Guards
import { JwtAuthGuard } from './common/guards';

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

    // Feature modules
    AuthModule,
    // UsersModule,
    TenantsModule,
    TenancyModule,
    ProductsModule,
    CategoriesModule,
    StoreModule, // Public storefront API
    OrdersModule,
    BillingModule,
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
  providers: [
    // Global JWT Auth Guard - all routes protected by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant resolution middleware to store routes
    consumer.apply(TenantResolutionMiddleware).forRoutes({
      path: 'store/*',
      method: RequestMethod.ALL,
    });
  }
}

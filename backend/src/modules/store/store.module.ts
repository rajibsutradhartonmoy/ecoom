import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ProductsModule, CategoriesModule, OrdersModule],
  controllers: [StoreController],
})
export class StoreModule {}

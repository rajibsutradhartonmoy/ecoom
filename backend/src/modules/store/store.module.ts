import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [ProductsModule, CategoriesModule],
  controllers: [StoreController],
})
export class StoreModule {}

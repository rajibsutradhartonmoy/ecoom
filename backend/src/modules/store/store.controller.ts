import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { OrdersService } from '../orders/orders.service';
import { ProductQueryDto } from '../products/dto';
import { CreateOrderDto } from '../orders/dto';
import { Public, CurrentTenant } from '@/common/decorators';

@ApiTags('store')
@Controller('store/:slug')
export class StoreController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly ordersService: OrdersService,
  ) {}

  @Public()
  @Get('products')
  @ApiOperation({ summary: 'List public products for store' })
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiResponse({ status: 200, description: 'List of active products' })
  async listProducts(@CurrentTenant('id') tenantId: string, @Query() query: ProductQueryDto) {
    // Force only active products for public store
    const publicQuery = {
      ...query,
      status: 'ACTIVE' as const,
    };

    return this.productsService.findAll(tenantId, publicQuery);
  }

  @Public()
  @Get('products/:productSlug')
  @ApiOperation({ summary: 'Get product details by slug' })
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiParam({ name: 'productSlug', description: 'Product slug' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @CurrentTenant('id') tenantId: string,
    @Param('productSlug') productSlug: string,
  ) {
    const product = await this.productsService.findBySlug(tenantId, productSlug);

    // Only return active products
    if (product.status !== 'ACTIVE') {
      throw new Error('Product not found');
    }

    return product;
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List categories for store' })
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiResponse({ status: 200, description: 'Category tree' })
  async listCategories(@CurrentTenant('id') tenantId: string) {
    return this.categoriesService.findTree(tenantId);
  }

  @Public()
  @Get('categories/:categorySlug')
  @ApiOperation({ summary: 'Get category with products' })
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiParam({ name: 'categorySlug', description: 'Category slug' })
  @ApiResponse({ status: 200, description: 'Category details' })
  async getCategory(
    @CurrentTenant('id') tenantId: string,
    @Param('categorySlug') categorySlug: string,
  ) {
    return this.categoriesService.findBySlug(tenantId, categorySlug);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiResponse({ status: 200, description: 'Featured products' })
  async getFeaturedProducts(@CurrentTenant('id') tenantId: string) {
    return this.productsService.findAll(tenantId, {
      isFeatured: true,
      status: 'ACTIVE' as const,
      limit: 12,
    });
  }

  @Public()
  @Post('checkout')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data or insufficient stock' })
  async createOrder(@CurrentTenant('id') tenantId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(tenantId, dto);
  }
}

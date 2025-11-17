import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { TenantGuard, RbacGuard } from '@/common/guards';
import { TenantId, Permissions, Permission } from '@/common/decorators';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(TenantGuard, RbacGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions(Permission.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product slug/SKU already exists' })
  create(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Get()
  @Permissions(Permission.PRODUCTS_READ)
  @ApiOperation({ summary: 'List products with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of products' })
  findAll(@TenantId() tenantId: string, @Query() query: ProductQueryDto) {
    return this.productsService.findAll(tenantId, query);
  }

  @Get(':id')
  @Permissions(Permission.PRODUCTS_READ)
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Permissions(Permission.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Delete or archive product' })
  @ApiResponse({ status: 200, description: 'Product deleted/archived successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(tenantId, id);
  }

  @Patch(':id/stock')
  @Permissions(Permission.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Update product stock (add or subtract)' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  updateStock(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.productsService.updateStock(tenantId, id, quantity);
  }
}

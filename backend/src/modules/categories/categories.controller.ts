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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { TenantGuard, RbacGuard } from '@/common/guards';
import { TenantId, Permissions, Permission } from '@/common/decorators';

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(TenantGuard, RbacGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Permissions(Permission.CATEGORIES_CREATE)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 409, description: 'Category slug already exists' })
  create(@TenantId() tenantId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Get()
  @Permissions(Permission.CATEGORIES_READ)
  @ApiOperation({ summary: 'List all categories for tenant' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'List of categories' })
  findAll(
    @TenantId() tenantId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.categoriesService.findAll(tenantId, includeInactive);
  }

  @Get('tree')
  @Permissions(Permission.CATEGORIES_READ)
  @ApiOperation({ summary: 'Get categories as tree structure' })
  @ApiResponse({ status: 200, description: 'Category tree' })
  findTree(@TenantId() tenantId: string) {
    return this.categoriesService.findTree(tenantId);
  }

  @Get(':id')
  @Permissions(Permission.CATEGORIES_READ)
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category details' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findOne(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Permissions(Permission.CATEGORIES_UPDATE)
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.CATEGORIES_DELETE)
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete category with products/subcategories' })
  remove(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(tenantId, id);
  }
}

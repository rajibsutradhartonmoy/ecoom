import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@/lib/db/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProductDto) {
    // Check slug uniqueness
    const slugExists = await this.prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug: dto.slug } },
    });

    if (slugExists) {
      throw new ConflictException('Product with this slug already exists');
    }

    // Check SKU uniqueness if provided
    if (dto.sku) {
      const skuExists = await this.prisma.product.findUnique({
        where: { tenantId_sku: { tenantId, sku: dto.sku } },
      });

      if (skuExists) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        sku: dto.sku,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        costPrice: dto.costPrice,
        stock: dto.stock ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
        trackInventory: dto.trackInventory ?? true,
        images: dto.images ?? [],
        categoryId: dto.categoryId,
        status: dto.status ?? 'DRAFT',
        isFeatured: dto.isFeatured ?? false,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    this.logger.log(`Product created: ${product.name} for tenant ${tenantId}`);

    return product;
  }

  async findAll(tenantId: string, query: ProductQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      status,
      minPrice,
      maxPrice,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (minPrice !== undefined) {
      where.price = { ...((where.price as object) || {}), gte: minPrice };
    }

    if (maxPrice !== undefined) {
      where.price = { ...((where.price as object) || {}), lte: maxPrice };
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    // Get total count
    const total = await this.prisma.product.count({ where });

    // Get products
    const products = await this.prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return {
      items: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(tenantId: string, slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    // Check slug uniqueness if updating
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.product.findUnique({
        where: { tenantId_slug: { tenantId, slug: dto.slug } },
      });

      if (slugExists) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    // Check SKU uniqueness if updating
    if (dto.sku && dto.sku !== existing.sku) {
      const skuExists = await this.prisma.product.findUnique({
        where: { tenantId_sku: { tenantId, sku: dto.sku } },
      });

      if (skuExists) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    // Validate category if updating
    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, tenantId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    this.logger.log(`Product updated: ${product.id}`);

    return product;
  }

  async remove(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { orderItems: true } } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product._count.orderItems > 0) {
      // Soft delete by setting status to ARCHIVED
      await this.prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      this.logger.log(`Product archived (has orders): ${id}`);

      return { message: 'Product archived successfully' };
    }

    await this.prisma.product.delete({ where: { id } });

    this.logger.log(`Product deleted: ${id}`);

    return { message: 'Product deleted successfully' };
  }

  async updateStock(tenantId: string, id: string, quantity: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new ConflictException('Insufficient stock');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });

    this.logger.log(`Product stock updated: ${id}, new stock: ${newStock}`);

    return updated;
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/lib/db/prisma.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateTenantDto) {
    // Check if slug is unique
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this slug already exists');
    }

    // Check if domain is unique (if provided)
    if (dto.domain) {
      const tenantWithDomain = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });

      if (tenantWithDomain) {
        throw new ConflictException('Tenant with this domain already exists');
      }
    }

    // Check if owner email is available
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.ownerEmail },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash owner password
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(dto.ownerPassword, rounds);

    // Create tenant with owner in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          settings: {
            currency: 'USD',
            timezone: 'UTC',
            language: 'en',
          },
        },
      });

      // Create owner user
      const owner = await tx.user.create({
        data: {
          email: dto.ownerEmail,
          passwordHash,
          firstName: dto.ownerFirstName,
          lastName: dto.ownerLastName,
          isVerified: true,
        },
      });

      // Link owner to tenant
      await tx.tenantUser.create({
        data: {
          userId: owner.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });

      return {
        tenant,
        owner: {
          id: owner.id,
          email: owner.email,
          firstName: owner.firstName,
          lastName: owner.lastName,
        },
      };
    });

    this.logger.log(`Tenant created: ${result.tenant.name} (${result.tenant.slug})`);

    return result;
  }

  async findAll(query: TenantQueryDto) {
    const { page = 1, limit = 20, search, status, subscriptionTier, subscriptionStatus, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (subscriptionTier) {
      where.subscriptionTier = subscriptionTier;
    }

    if (subscriptionStatus) {
      where.subscriptionStatus = subscriptionStatus;
    }

    // Get total count
    const total = await this.prisma.tenant.count({ where });

    // Get tenants
    const tenants = await this.prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
            customers: true,
          },
        },
      },
    });

    return {
      items: tenants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
            categories: true,
            coupons: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    // Check tenant exists
    const existing = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Tenant not found');
    }

    // Check slug uniqueness if updating
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.tenant.findUnique({
        where: { slug: dto.slug },
      });

      if (slugExists) {
        throw new ConflictException('Tenant with this slug already exists');
      }
    }

    // Check domain uniqueness if updating
    if (dto.domain && dto.domain !== existing.domain) {
      const domainExists = await this.prisma.tenant.findUnique({
        where: { domain: dto.domain },
      });

      if (domainExists) {
        throw new ConflictException('Tenant with this domain already exists');
      }
    }

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Tenant updated: ${tenant.id}`);

    return tenant;
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft delete by setting status to DELETED
    await this.prisma.tenant.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    this.logger.log(`Tenant soft-deleted: ${tenant.id}`);

    return { message: 'Tenant deleted successfully' };
  }

  async getStats(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const [productsCount, ordersCount, customersCount, revenue] = await Promise.all([
      this.prisma.product.count({ where: { tenantId: id } }),
      this.prisma.order.count({ where: { tenantId: id } }),
      this.prisma.customer.count({ where: { tenantId: id } }),
      this.prisma.order.aggregate({
        where: { tenantId: id, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
    ]);

    return {
      tenantId: id,
      products: productsCount,
      orders: ordersCount,
      customers: customersCount,
      totalRevenue: revenue._sum.total || 0,
    };
  }
}

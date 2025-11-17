import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/lib/db/prisma.service';

@Injectable()
export class TenancyService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with slug '${slug}' not found`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new NotFoundException('Tenant is not active');
    }

    return tenant;
  }

  async getTenantByDomain(domain: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { domain },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with domain '${domain}' not found`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new NotFoundException('Tenant is not active');
    }

    return tenant;
  }

  async validateUserTenantAccess(userId: string, tenantId: string) {
    const tenantUser = await this.prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      include: {
        tenant: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!tenantUser) {
      return null;
    }

    if (tenantUser.tenant.status !== 'ACTIVE') {
      return null;
    }

    return tenantUser;
  }
}

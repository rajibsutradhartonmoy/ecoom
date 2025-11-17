import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenancyService } from '@/modules/tenancy/tenancy.service';

// Extend Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        slug: string;
        name: string;
      };
      tenantId?: string;
      tenantRole?: string;
    }
  }
}

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(private readonly tenancyService: TenancyService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Extract tenant slug from URL path
    // Expected format: /api/store/:slug/...
    const pathMatch = req.path.match(/^\/store\/([a-z0-9-]+)/);

    if (pathMatch) {
      const slug = pathMatch[1];

      try {
        const tenant = await this.tenancyService.getTenantBySlug(slug);
        req.tenant = {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        };
        req.tenantId = tenant.id;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new NotFoundException('Tenant not found');
      }
    }

    // Also check for custom domain (if implementing subdomain-based tenancy)
    // This would require additional configuration
    // const host = req.headers.host;
    // if (host && !host.includes('localhost')) {
    //   const tenant = await this.tenancyService.getTenantByDomain(host);
    //   req.tenant = tenant;
    //   req.tenantId = tenant.id;
    // }

    next();
  }
}

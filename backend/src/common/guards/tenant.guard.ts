import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TenancyService } from '@/modules/tenancy/tenancy.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenancyService: TenancyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if tenant is already resolved (e.g., from path parameter)
    if (request.tenant) {
      // Validate user has access to this tenant
      if (user && !user.isSuperAdmin) {
        const hasAccess = await this.tenancyService.validateUserTenantAccess(
          user.id,
          request.tenant.id,
        );

        if (!hasAccess) {
          throw new ForbiddenException('You do not have access to this tenant');
        }

        // Add role to request for RBAC
        request.tenantRole = hasAccess.role;
      }

      return true;
    }

    // Try to get tenant from header (X-Tenant-ID)
    const tenantIdHeader = request.headers['x-tenant-id'];
    if (tenantIdHeader) {
      if (!user) {
        throw new ForbiddenException('Authentication required');
      }

      if (user.isSuperAdmin) {
        // Super admin can access any tenant
        request.tenantId = tenantIdHeader;
        return true;
      }

      // Validate user has access
      const hasAccess = await this.tenancyService.validateUserTenantAccess(
        user.id,
        tenantIdHeader,
      );

      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this tenant');
      }

      request.tenantId = tenantIdHeader;
      request.tenantRole = hasAccess.role;
      return true;
    }

    // Try to get tenant from user's tenants (if they have only one)
    if (user && !user.isSuperAdmin && user.tenants?.length === 1) {
      request.tenantId = user.tenants[0].tenantId;
      request.tenantRole = user.tenants[0].role;
      return true;
    }

    // No tenant context found
    throw new BadRequestException(
      'Tenant context required. Provide X-Tenant-ID header or access via tenant-specific route.',
    );
  }
}

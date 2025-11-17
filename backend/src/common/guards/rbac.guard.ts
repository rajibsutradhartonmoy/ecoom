import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { TenantRole } from '@prisma/client';

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: Record<TenantRole, number> = {
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
  OWNER: 4,
};

// Permission definitions for each role
const ROLE_PERMISSIONS: Record<TenantRole, string[]> = {
  STAFF: [
    'orders:read',
    'orders:update',
    'products:read',
    'customers:read',
    'categories:read',
  ],
  MANAGER: [
    'orders:read',
    'orders:update',
    'orders:create',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'customers:read',
    'customers:create',
    'customers:update',
    'categories:read',
    'categories:create',
    'categories:update',
    'categories:delete',
    'coupons:read',
    'coupons:create',
    'coupons:update',
    'coupons:delete',
    'analytics:read',
  ],
  ADMIN: [
    'orders:read',
    'orders:update',
    'orders:create',
    'orders:delete',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'customers:read',
    'customers:create',
    'customers:update',
    'customers:delete',
    'categories:read',
    'categories:create',
    'categories:update',
    'categories:delete',
    'coupons:read',
    'coupons:create',
    'coupons:update',
    'coupons:delete',
    'shipping:read',
    'shipping:create',
    'shipping:update',
    'shipping:delete',
    'taxes:read',
    'taxes:create',
    'taxes:update',
    'taxes:delete',
    'analytics:read',
    'settings:read',
    'settings:update',
    'users:read',
    'users:create',
    'users:update',
  ],
  OWNER: [
    'orders:read',
    'orders:update',
    'orders:create',
    'orders:delete',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'customers:read',
    'customers:create',
    'customers:update',
    'customers:delete',
    'categories:read',
    'categories:create',
    'categories:update',
    'categories:delete',
    'coupons:read',
    'coupons:create',
    'coupons:update',
    'coupons:delete',
    'shipping:read',
    'shipping:create',
    'shipping:update',
    'shipping:delete',
    'taxes:read',
    'taxes:create',
    'taxes:update',
    'taxes:delete',
    'analytics:read',
    'settings:read',
    'settings:update',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'billing:read',
    'billing:update',
    'tenant:read',
    'tenant:update',
    'tenant:delete',
  ],
};

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions required, allow access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super admin bypasses all checks
    if (user.isSuperAdmin) {
      return true;
    }

    // Get user's role for current tenant
    const tenantRole = request.tenantRole as TenantRole;

    if (!tenantRole) {
      throw new ForbiddenException('Tenant context required for RBAC check');
    }

    // Check role requirements
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = this.checkRoleHierarchy(tenantRole, requiredRoles);
      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Insufficient role. Required: ${requiredRoles.join(' or ')}`,
        );
      }
    }

    // Check permission requirements
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = this.checkPermissions(tenantRole, requiredPermissions);
      if (!hasRequiredPermissions) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }

  private checkRoleHierarchy(userRole: TenantRole, requiredRoles: TenantRole[]): boolean {
    const userRoleLevel = ROLE_HIERARCHY[userRole];

    // User passes if their role level is >= any of the required roles
    return requiredRoles.some((role) => userRoleLevel >= ROLE_HIERARCHY[role]);
  }

  private checkPermissions(userRole: TenantRole, requiredPermissions: string[]): boolean {
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // User must have ALL required permissions
    return requiredPermissions.every((permission) => userPermissions.includes(permission));
  }
}

// Helper to get all permissions for a role
export function getRolePermissions(role: TenantRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Helper to check if role has specific permission
export function roleHasPermission(role: TenantRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

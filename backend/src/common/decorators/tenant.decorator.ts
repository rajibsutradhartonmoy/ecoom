import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface TenantContext {
  id: string;
  slug: string;
  name: string;
}

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantContext;

    if (!tenant) {
      return null;
    }

    return data ? tenant[data] : tenant;
  },
);

// Shorthand for getting just tenant ID
export const TenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenant?.id || request.tenantId;
});

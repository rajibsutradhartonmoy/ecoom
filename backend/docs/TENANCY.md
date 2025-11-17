# Multi-Tenancy Architecture

## Overview

Ecoom uses a **Single Database, Shared Schema** multi-tenancy model. All tenants share the same database and schema, with data isolation enforced through `tenant_id` foreign keys.

## Tenancy Model

```
┌─────────────────────────────────────────┐
│           PostgreSQL Database           │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │Tenant A │  │Tenant B │  │Tenant C │ │
│  │  Data   │  │  Data   │  │  Data   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────────┘
```

## Tenant Resolution

Tenants are resolved via URL path:

```
Public Store:  /store/:slug/...
Admin API:     /api/... (tenant from JWT)
```

### Resolution Flow

1. **Public storefront** - Extract tenant from URL path (`/store/acme-store`)
2. **Authenticated API** - Extract tenant from JWT claims
3. **Super admin** - No tenant context (platform-wide access)

## Data Isolation Strategy

### 1. Schema Design

Every tenant-scoped table includes:

```prisma
model Product {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  // ... other fields

  @@index([tenantId])
}
```

### 2. Query Scoping

All queries are automatically scoped to the current tenant:

```typescript
// Service method
async findAll(tenantId: string) {
  return this.prisma.product.findMany({
    where: { tenantId },
  });
}
```

### 3. Guard Enforcement

The `TenantGuard` ensures tenant context is present:

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    return true;
  }
}
```

### 4. Decorator Usage

Apply tenant scoping via decorators:

```typescript
@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.productsService.findAll(tenantId);
  }
}
```

## Tenant Lifecycle

### Creation

1. User signs up for platform
2. System creates tenant record
3. System creates tenant admin user
4. Stripe subscription initiated
5. Default store settings configured

### Activation

- Tenant active after successful subscription
- Can be suspended for non-payment
- Can be deleted (soft delete with data retention)

### Data Ownership

- Each tenant owns their data exclusively
- Platform admins can view but not modify tenant data
- Tenants can export their data (GDPR compliance)

## Security Considerations

### 1. Query-Level Isolation

```typescript
// ALWAYS include tenantId in queries
const products = await prisma.product.findMany({
  where: {
    tenantId: currentTenantId,  // Required
    status: 'active',
  },
});
```

### 2. Preventing Cross-Tenant Access

```typescript
// Middleware validates tenant ownership
async validateOwnership(resourceId: string, tenantId: string) {
  const resource = await this.findOne(resourceId);
  if (resource.tenantId !== tenantId) {
    throw new ForbiddenException('Access denied');
  }
}
```

### 3. Audit Logging

All data modifications are logged with tenant context:

```typescript
{
  timestamp: '2024-01-01T12:00:00Z',
  tenantId: 'tenant_123',
  userId: 'user_456',
  action: 'product.update',
  resourceId: 'prod_789',
  changes: { ... }
}
```

## Performance Optimizations

### 1. Database Indexes

```prisma
@@index([tenantId])              // For all tenant-scoped queries
@@index([tenantId, createdAt])   // For sorted listings
@@index([tenantId, status])      // For filtered queries
```

### 2. Connection Pooling

- Shared connection pool across tenants
- Efficient resource utilization
- No per-tenant connection overhead

### 3. Query Optimization

- Tenant ID as leading column in composite indexes
- Partition-friendly query patterns
- Avoid cross-tenant joins

## Tenant Configuration

Each tenant can customize:

- Store branding (logo, colors)
- Currency and locale
- Tax settings
- Shipping zones
- Email templates
- Payment methods

## Scaling Considerations

### Current Architecture (Shared Database)

**Pros:**
- Simple deployment
- Efficient resource usage
- Easy cross-tenant queries (for platform analytics)

**Cons:**
- Single point of failure
- Noisy neighbor potential
- Size limitations

### Future Options

1. **Database per tenant** - Full isolation
2. **Sharding** - Horizontal partitioning
3. **Schema per tenant** - PostgreSQL schemas

## Compliance

### Data Privacy

- Tenant data logically separated
- Row-level security possible
- Encryption at rest

### GDPR Support

- Data portability (export)
- Right to deletion
- Access logs
- Consent management

## Testing Tenant Isolation

```typescript
describe('Tenant Isolation', () => {
  it('should not access other tenant data', async () => {
    const tenantA = await createTenant('A');
    const tenantB = await createTenant('B');

    const productA = await createProduct(tenantA.id);

    // Should not find product from tenant A
    const results = await findProducts(tenantB.id);
    expect(results).not.toContain(productA);
  });
});
```

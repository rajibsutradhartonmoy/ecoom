# Backend Architecture

## Overview

The Ecoom backend is built with NestJS, providing a modular, scalable architecture for multi-tenant ecommerce operations.

## Technology Stack

- **Framework**: NestJS v10
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL via Prisma ORM
- **Authentication**: JWT with refresh tokens
- **API Style**: RESTful with OpenAPI/Swagger documentation
- **Validation**: Zod + class-validator

## Directory Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   │
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Authentication & authorization
│   │   ├── tenancy/            # Multi-tenant middleware
│   │   ├── users/              # User management
│   │   ├── tenants/            # Tenant management
│   │   ├── products/           # Product catalog
│   │   ├── categories/         # Product categories
│   │   ├── orders/             # Order processing
│   │   ├── customers/          # Customer accounts
│   │   ├── coupons/            # Discount codes
│   │   ├── shipping/           # Shipping rules
│   │   ├── taxes/              # Tax calculations
│   │   ├── analytics/          # Reporting & metrics
│   │   ├── billing/            # SaaS subscription billing
│   │   ├── checkout/           # Customer checkout flow
│   │   ├── email/              # Email service
│   │   └── logger/             # Structured logging
│   │
│   ├── common/                 # Shared utilities
│   │   ├── guards/             # Auth & permission guards
│   │   ├── interceptors/       # Request/response transformers
│   │   ├── filters/            # Exception filters
│   │   └── decorators/         # Custom decorators
│   │
│   ├── lib/                    # Library modules
│   │   ├── db/                 # Prisma database service
│   │   ├── stripe/             # Stripe integration
│   │   ├── utils/              # Helper functions
│   │   └── validation/         # Zod schemas
│   │
│   └── prisma/                 # Database schema & migrations
│       ├── schema.prisma
│       ├── migrations/
│       └── seed.ts
│
├── test/                       # Test suites
│   ├── unit/
│   └── integration/
│
└── docs/                       # Documentation
    ├── ARCHITECTURE.md
    ├── API.md
    └── TENANCY.md
```

## Module Architecture

Each feature module follows this pattern:

```
module-name/
├── module-name.module.ts       # Module definition
├── module-name.controller.ts   # HTTP endpoints
├── module-name.service.ts      # Business logic
├── dto/                        # Data transfer objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── *.response.dto.ts
├── entities/                   # Type definitions
└── tests/
    └── *.spec.ts
```

## Request Lifecycle

1. **Request arrives** at NestJS
2. **Global middleware** applies (CORS, body parsing)
3. **Tenant resolution** extracts tenant from path/domain
4. **Authentication guard** validates JWT
5. **RBAC guard** checks permissions
6. **Validation pipe** validates request body
7. **Controller** handles request
8. **Service** executes business logic
9. **Response interceptor** transforms response
10. **Exception filter** handles errors

## Data Flow

```
Controller → Service → Prisma → PostgreSQL
     ↓           ↓
    DTO    Tenant Scoping
```

## Security Layers

1. **Rate limiting** - Throttle requests
2. **Authentication** - JWT verification
3. **Authorization** - RBAC permissions
4. **Tenant isolation** - Data scoping
5. **Input validation** - Schema validation
6. **SQL injection protection** - Prisma parameterization

## Key Design Decisions

### 1. Global Prisma Module
- Single PrismaService instance
- Connection pooling managed by Prisma
- Automatic cleanup on shutdown

### 2. Config-driven Features
- Environment-based configuration
- Feature flags for optional features
- Secrets management via env vars

### 3. Error Handling
- Global exception filter
- Structured error responses
- Sensitive info sanitization

### 4. Logging Strategy
- Request/response logging
- Tenant context in logs
- Performance metrics

## Performance Considerations

- Connection pooling for database
- Redis caching (optional)
- Query optimization with Prisma
- Rate limiting per tenant
- Background job processing

## Scalability

- Horizontal scaling via stateless design
- Database read replicas support
- CDN for static assets
- Queue-based async processing

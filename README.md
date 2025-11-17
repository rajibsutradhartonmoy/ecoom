# Ecoom - Multi-Tenant Ecommerce SaaS Platform

A production-grade multi-tenant ecommerce SaaS application built with NestJS, Next.js, and PostgreSQL.

## Features

### Platform Features
- **Multi-Tenant Architecture**: Single database, shared schema with tenant_id isolation
- **Super Admin Dashboard**: Platform management, user management, subscription plans
- **Tenant Admin Dashboard**: Store management with analytics, orders, products, customers
- **Public Storefronts**: Dynamic storefronts with cart and checkout functionality
- **SaaS Billing**: Stripe subscription management with usage limits and invoicing
- **RBAC**: Hierarchical roles (OWNER > ADMIN > MANAGER > STAFF) with 50+ granular permissions

### Ecommerce Features
- Product catalog with categories, variants, images
- Inventory management with low stock alerts
- Shopping cart with localStorage persistence
- Checkout with customer management
- Order lifecycle management (pending → confirmed → shipped → delivered)
- Coupon system with percentage/fixed discounts and usage limits
- Customer database with order history and spending analytics

### Technical Features
- JWT authentication with refresh token rotation
- Global exception handling and response formatting
- Request rate limiting
- Tenant resolution middleware
- Automatic API documentation (Swagger)
- Database transactions for data integrity

## Tech Stack

### Backend (NestJS)
- Node.js 18+ with TypeScript
- NestJS framework with modular architecture
- Prisma ORM with PostgreSQL
- JWT + Refresh Token authentication
- Stripe SDK for payments
- Swagger/OpenAPI documentation

### Frontend (Next.js 14)
- React 18 with TypeScript
- App Router with Server Components
- TailwindCSS styling
- shadcn/ui component library
- React Query for data fetching
- Zod for validation

### Infrastructure
- PostgreSQL database
- Redis for caching (optional)
- Docker Compose for local development
- pnpm workspaces monorepo

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Stripe account (for billing features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/ecoom.git
cd ecoom
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

4. Start PostgreSQL (using Docker):
```bash
docker-compose up -d postgres
```

5. Set up the database:
```bash
cd backend
pnpm prisma generate
pnpm prisma db push
# Optional: Seed with sample data
pnpm prisma db seed
```

6. Start development servers:
```bash
# From root directory
pnpm dev
# Or start individually:
# Backend: cd backend && pnpm dev (runs on :3001)
# Frontend: cd frontend && pnpm dev (runs on :3000)
```

7. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

## Project Structure

```
ecoom/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication & JWT
│   │   │   ├── tenants/       # Tenant management
│   │   │   ├── tenancy/       # Multi-tenancy utilities
│   │   │   ├── products/      # Product catalog
│   │   │   ├── categories/    # Product categories
│   │   │   ├── orders/        # Order management
│   │   │   ├── customers/     # Customer database
│   │   │   ├── coupons/       # Coupon system
│   │   │   ├── billing/       # Stripe subscriptions
│   │   │   ├── analytics/     # Business metrics
│   │   │   └── store/         # Public storefront API
│   │   ├── common/            # Shared utilities
│   │   │   ├── guards/        # Auth & RBAC guards
│   │   │   ├── decorators/    # Custom decorators
│   │   │   ├── filters/       # Exception filters
│   │   │   ├── interceptors/  # Response interceptors
│   │   │   └── middleware/    # Tenant resolution
│   │   ├── lib/               # Library integrations
│   │   │   └── db/            # Prisma service
│   │   └── prisma/            # Database schema
│   └── package.json
│
├── frontend/                   # Next.js App
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── auth/          # Login/Register
│   │   │   ├── dashboard/     # Admin dashboards
│   │   │   │   ├── admin/     # Super admin
│   │   │   │   └── tenant/    # Tenant admin
│   │   │   └── store/         # Public storefronts
│   │   ├── components/        # React components
│   │   │   ├── ui/            # shadcn/ui
│   │   │   ├── layout/        # Layout components
│   │   │   └── store/         # Store components
│   │   └── lib/               # Utilities
│   │       ├── api.ts         # API client
│   │       ├── auth-context.tsx
│   │       └── store/         # Cart state
│   └── package.json
│
├── docs/                       # Documentation
├── docker-compose.yml          # Local services
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # Monorepo config
└── package.json                # Root package
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Revoke refresh token
- `GET /auth/me` - Get current user

### Tenants (Super Admin)
- `GET /tenants` - List all tenants
- `POST /tenants` - Create tenant
- `GET /tenants/:id` - Get tenant details
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant

### Products (Tenant Admin)
- `GET /products` - List products with pagination
- `POST /products` - Create product
- `GET /products/:id` - Get product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Orders (Tenant Admin)
- `GET /orders` - List orders with filters
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update order status

### Customers (Tenant Admin)
- `GET /customers` - List customers
- `GET /customers/:id` - Get customer with orders
- `GET /customers/stats` - Customer statistics

### Coupons (Tenant Admin)
- `GET /coupons` - List coupons
- `POST /coupons` - Create coupon
- `PUT /coupons/:id` - Update coupon
- `DELETE /coupons/:id` - Delete coupon
- `POST /coupons/validate` - Validate coupon code

### Analytics (Tenant Admin)
- `GET /analytics/dashboard` - Dashboard statistics
- `GET /analytics/revenue-chart` - Revenue over time
- `GET /analytics/order-status` - Order status distribution

### Billing (Tenant Admin)
- `GET /billing/plans` - List public subscription plans
- `GET /billing/subscription` - Current subscription
- `GET /billing/usage` - Plan usage and limits
- `POST /billing/checkout` - Create Stripe checkout session
- `POST /billing/portal` - Create billing portal session
- `POST /billing/cancel` - Cancel subscription
- `POST /billing/resume` - Resume canceled subscription

### Public Store API
- `GET /store/:slug/products` - List store products
- `GET /store/:slug/products/:productSlug` - Get product
- `GET /store/:slug/categories` - List categories
- `GET /store/:slug/featured` - Featured products
- `POST /store/:slug/checkout` - Create order

## Stripe Configuration

1. Create a Stripe account at https://stripe.com

2. Get your API keys from the Dashboard

3. Set up webhook endpoint:
   - URL: `https://your-domain/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

4. Configure environment variables:
```bash
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

5. Create subscription plans via the API:
```bash
POST /billing/admin/plans
{
  "name": "starter",
  "displayName": "Starter Plan",
  "priceMonthly": 29.99,
  "priceYearly": 299.99,
  "maxProducts": 100,
  "maxOrders": 1000,
  "maxStorage": 5000,
  "maxStaff": 5,
  "features": ["custom_domain", "analytics"]
}
```

## Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (min 256 bits)
- [ ] Configure production database
- [ ] Set up SSL/TLS
- [ ] Configure CORS origins
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up database backups
- [ ] Configure CDN for static assets
- [ ] Set up CI/CD pipeline

### Docker Production Build
```dockerfile
# Backend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3001
CMD ["node", "dist/main"]
```

### Environment Variables (Production)
```bash
# Security
JWT_SECRET=<64-character-random-string>
JWT_REFRESH_SECRET=<64-character-random-string>
BCRYPT_ROUNDS=12

# Database
DATABASE_URL=postgresql://user:pass@host:5432/ecoom?sslmode=require

# Stripe (Live Keys)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Application
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
```

## Testing

### Backend Tests
```bash
cd backend
pnpm test           # Unit tests
pnpm test:e2e       # E2E tests
pnpm test:cov       # Coverage report
```

### Frontend Tests
```bash
cd frontend
pnpm test           # Jest tests
pnpm test:watch     # Watch mode
```

## Development Commands

```bash
# Root level
pnpm dev            # Start all services
pnpm build          # Build all packages
pnpm lint           # Lint all packages
pnpm format         # Format code

# Backend
cd backend
pnpm prisma studio  # Open Prisma Studio
pnpm prisma migrate # Run migrations
pnpm prisma generate # Generate Prisma Client

# Frontend
cd frontend
pnpm build          # Production build
pnpm analyze        # Analyze bundle
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT License - See LICENSE file for details.

## Support

- Documentation: `/docs` folder
- Issues: GitHub Issues
- API Docs: `/api/docs` (Swagger UI)

---

Built with ❤️ by the Ecoom Team

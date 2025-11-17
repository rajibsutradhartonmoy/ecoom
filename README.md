# Ecoom - Multi-Tenant Ecommerce SaaS Platform

A production-grade multi-tenant ecommerce SaaS application built with NestJS, Next.js, and PostgreSQL.

## Features

- **Multi-Tenant Architecture**: Single database, shared schema with tenant isolation
- **Super Admin Dashboard**: Platform-wide management and analytics
- **Tenant Admin Dashboard**: Per-merchant store management
- **Public Storefronts**: Customizable storefronts per tenant
- **SaaS Billing**: Stripe-based subscription management
- **Ecommerce Checkout**: Full shopping cart and payment processing
- **RBAC**: Role-based access control with granular permissions

## Tech Stack

### Backend
- Node.js + TypeScript
- NestJS framework
- Prisma ORM
- PostgreSQL
- Redis (caching & queues)
- Stripe (SaaS + checkout)
- JWT authentication

### Frontend
- Next.js 14 (App Router)
- React + TypeScript
- TailwindCSS
- shadcn/ui components
- React Query

## Project Structure

```
/
├── backend/           # NestJS API server
│   ├── src/
│   │   ├── modules/   # Feature modules
│   │   ├── common/    # Shared utilities
│   │   ├── lib/       # Libraries
│   │   └── prisma/    # Database schema
│   └── docs/          # Backend documentation
│
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/# React components
│   │   ├── hooks/     # Custom hooks
│   │   └── lib/       # Utilities
│   └── docs/          # Frontend documentation
│
└── docs/              # Project-wide documentation
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL >= 15
- Redis >= 7 (optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ecoom

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Setup database
pnpm db:migrate
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Variables

See `.env.example` for required environment variables.

## Development

```bash
# Run all services in development
pnpm dev

# Run only backend
pnpm --filter backend dev

# Run only frontend
pnpm --filter frontend dev

# Format code
pnpm format

# Lint code
pnpm lint

# Run tests
pnpm test
```

## Database Management

```bash
# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

## Architecture

See the following documentation:
- [Backend Architecture](./backend/docs/ARCHITECTURE.md)
- [Frontend Architecture](./frontend/docs/FRONTEND_ARCHITECTURE.md)
- [Multi-Tenancy Model](./backend/docs/TENANCY.md)
- [API Documentation](./backend/docs/API.md)

## License

MIT

# Frontend Architecture

## Overview

The Ecoom frontend is built with Next.js 14 using the App Router, providing a modern React application with server-side rendering capabilities.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Testing**: Jest + React Testing Library + Playwright

## Directory Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── dashboard/         # Admin dashboards
│   │   │   ├── admin/         # Super admin dashboard
│   │   │   └── tenant/        # Tenant admin dashboard
│   │   ├── store/             # Public storefronts
│   │   │   └── [slug]/        # Dynamic tenant store
│   │   ├── auth/              # Authentication pages
│   │   └── api/               # API routes (if needed)
│   │
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── charts/            # Data visualization
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   └── useCart.ts
│   │
│   ├── lib/                   # Utility functions
│   │   ├── utils.ts
│   │   ├── api.ts             # API client
│   │   └── validations.ts     # Zod schemas
│   │
│   ├── styles/                # Global styles
│   │   └── globals.css
│   │
│   └── tests/                 # Test suites
│       ├── unit/
│       └── e2e/
│
├── public/                    # Static assets
└── docs/                      # Documentation
```

## Routing Structure

### App Routes

```
/                           # Landing page
/auth/login                 # Login page
/auth/register              # Registration page
/auth/forgot-password       # Password reset

/dashboard/admin            # Super admin dashboard
/dashboard/admin/tenants    # Tenant management
/dashboard/admin/billing    # Billing overview
/dashboard/admin/analytics  # Platform analytics

/dashboard/tenant           # Tenant admin dashboard
/dashboard/tenant/products  # Product management
/dashboard/tenant/orders    # Order management
/dashboard/tenant/customers # Customer management
/dashboard/tenant/settings  # Store settings

/store/[slug]               # Public storefront
/store/[slug]/products      # Product listing
/store/[slug]/products/[id] # Product details
/store/[slug]/cart          # Shopping cart
/store/[slug]/checkout      # Checkout flow
```

## Component Architecture

### Component Categories

1. **UI Components** (`/components/ui/`)
   - shadcn/ui primitives
   - Buttons, inputs, modals, etc.
   - Highly reusable, styling-focused

2. **Form Components** (`/components/forms/`)
   - Form-specific components
   - Integrated with React Hook Form
   - Validation with Zod

3. **Layout Components** (`/components/layout/`)
   - Page layouts, navigation
   - Sidebars, headers, footers
   - Responsive design patterns

4. **Feature Components**
   - Business logic components
   - Composed from primitives
   - Domain-specific

### Component Pattern

```tsx
// components/products/ProductCard.tsx
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card>
      <CardContent>
        {/* Product details */}
      </CardContent>
      <CardFooter>
        <Button onClick={() => onAddToCart(product.id)}>
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## State Management

### React Query for Server State

```tsx
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProducts(tenantId: string) {
  return useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => api.products.list(tenantId),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

### React Context for Global UI State

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState } from 'react';

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

## Authentication Flow

1. User submits credentials
2. API returns access + refresh tokens
3. Tokens stored in httpOnly cookies
4. React Query manages auth state
5. Middleware protects routes

## API Integration

### API Client

```tsx
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private accessToken: string | null = null;

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken && {
          Authorization: `Bearer ${this.accessToken}`,
        }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response);
    }

    return response.json();
  }
}
```

## Performance Optimizations

1. **Server Components** - Default for static content
2. **Client Components** - Only for interactivity
3. **Image Optimization** - Next.js Image component
4. **Code Splitting** - Automatic with App Router
5. **Caching** - React Query caching strategies

## Testing Strategy

### Unit Tests (Jest)

- Component rendering
- Hook behavior
- Utility functions

### Integration Tests

- Component interactions
- Form submissions
- API mocking

### E2E Tests (Playwright)

- User flows
- Authentication
- Checkout process

## Styling Guidelines

### TailwindCSS Usage

- Utility-first approach
- Custom theme in `tailwind.config.js`
- CSS variables for theming

### shadcn/ui Components

- Copy-paste components
- Full control over styling
- Consistent design system

## Security Considerations

1. **XSS Protection** - React's built-in escaping
2. **CSRF** - Token-based protection
3. **Secure Cookies** - httpOnly, secure flags
4. **Input Validation** - Zod schemas
5. **Content Security Policy** - Next.js headers

## Deployment

- **Platform**: Vercel
- **Environment Variables**: Via Vercel dashboard
- **Preview Deployments**: Per PR
- **Production**: Main branch

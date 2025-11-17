# API Documentation

## Overview

The Ecoom API is a RESTful API with JSON payloads. All endpoints are prefixed with `/api`.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.ecoom.com/api`

## Authentication

The API uses JWT Bearer tokens for authentication.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Refresh

Access tokens expire after 15 minutes. Use the refresh token to obtain a new access token.

## API Endpoints

### Authentication

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Logout (invalidate refresh token)
GET    /api/auth/me                # Get current user
```

### Tenants (Super Admin)

```
GET    /api/tenants                # List all tenants
POST   /api/tenants                # Create tenant
GET    /api/tenants/:id            # Get tenant details
PATCH  /api/tenants/:id            # Update tenant
DELETE /api/tenants/:id            # Delete tenant
```

### Users

```
GET    /api/users                  # List users (tenant-scoped)
POST   /api/users                  # Create user
GET    /api/users/:id              # Get user details
PATCH  /api/users/:id              # Update user
DELETE /api/users/:id              # Delete user
```

### Products

```
GET    /api/products               # List products (tenant-scoped)
POST   /api/products               # Create product
GET    /api/products/:id           # Get product details
PATCH  /api/products/:id           # Update product
DELETE /api/products/:id           # Delete product
POST   /api/products/:id/images    # Upload product images
```

### Categories

```
GET    /api/categories             # List categories (tenant-scoped)
POST   /api/categories             # Create category
GET    /api/categories/:id         # Get category details
PATCH  /api/categories/:id         # Update category
DELETE /api/categories/:id         # Delete category
```

### Orders

```
GET    /api/orders                 # List orders (tenant-scoped)
GET    /api/orders/:id             # Get order details
PATCH  /api/orders/:id/status      # Update order status
```

### Customers

```
GET    /api/customers              # List customers (tenant-scoped)
GET    /api/customers/:id          # Get customer details
GET    /api/customers/:id/orders   # Get customer orders
```

### Coupons

```
GET    /api/coupons                # List coupons (tenant-scoped)
POST   /api/coupons                # Create coupon
GET    /api/coupons/:id            # Get coupon details
PATCH  /api/coupons/:id            # Update coupon
DELETE /api/coupons/:id            # Delete coupon
POST   /api/coupons/validate       # Validate coupon code
```

### Shipping

```
GET    /api/shipping/rules         # List shipping rules
POST   /api/shipping/rules         # Create shipping rule
PATCH  /api/shipping/rules/:id     # Update shipping rule
DELETE /api/shipping/rules/:id     # Delete shipping rule
POST   /api/shipping/calculate     # Calculate shipping cost
```

### Taxes

```
GET    /api/taxes/rules            # List tax rules
POST   /api/taxes/rules            # Create tax rule
PATCH  /api/taxes/rules/:id        # Update tax rule
DELETE /api/taxes/rules/:id        # Delete tax rule
POST   /api/taxes/calculate        # Calculate taxes
```

### Analytics

```
GET    /api/analytics/dashboard    # Dashboard metrics
GET    /api/analytics/sales        # Sales reports
GET    /api/analytics/products     # Product performance
GET    /api/analytics/customers    # Customer insights
```

### Billing (SaaS)

```
GET    /api/billing/subscription   # Get current subscription
POST   /api/billing/subscribe      # Create subscription
PATCH  /api/billing/subscription   # Update subscription
DELETE /api/billing/subscription   # Cancel subscription
GET    /api/billing/invoices       # List invoices
POST   /api/billing/webhook        # Stripe webhook handler
```

### Public Store API

```
GET    /api/store/:slug/products           # Public product listing
GET    /api/store/:slug/products/:id       # Public product details
GET    /api/store/:slug/categories         # Public categories
POST   /api/store/:slug/checkout           # Create checkout session
POST   /api/store/:slug/checkout/complete  # Complete order
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `CONFLICT` - Resource conflict
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Pagination

List endpoints support pagination:

```
GET /api/products?page=1&limit=20&sort=createdAt&order=desc
```

## Filtering

List endpoints support filtering:

```
GET /api/products?category=electronics&minPrice=10&maxPrice=100&status=active
```

## Swagger Documentation

Interactive API documentation available at:
- **Development**: `http://localhost:3001/api/docs`

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: Higher limits based on subscription tier
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Common permission strings for type safety
export const Permission = {
  // Orders
  ORDERS_READ: 'orders:read',
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE: 'orders:update',
  ORDERS_DELETE: 'orders:delete',

  // Products
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  // Categories
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  // Customers
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',

  // Coupons
  COUPONS_READ: 'coupons:read',
  COUPONS_CREATE: 'coupons:create',
  COUPONS_UPDATE: 'coupons:update',
  COUPONS_DELETE: 'coupons:delete',

  // Shipping
  SHIPPING_READ: 'shipping:read',
  SHIPPING_CREATE: 'shipping:create',
  SHIPPING_UPDATE: 'shipping:update',
  SHIPPING_DELETE: 'shipping:delete',

  // Taxes
  TAXES_READ: 'taxes:read',
  TAXES_CREATE: 'taxes:create',
  TAXES_UPDATE: 'taxes:update',
  TAXES_DELETE: 'taxes:delete',

  // Analytics
  ANALYTICS_READ: 'analytics:read',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Users
  USERS_READ: 'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Billing
  BILLING_READ: 'billing:read',
  BILLING_UPDATE: 'billing:update',

  // Tenant
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isSuperAdmin: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  tenants: TenantMembership[];
}

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantStatus?: string;
  role: TenantRole;
}

export type TenantRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  status: TenantStatus;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    products: number;
    orders: number;
    customers: number;
  };
}

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type SubscriptionTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

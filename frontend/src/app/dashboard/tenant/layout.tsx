'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

const tenantNavItems = [
  { title: 'Overview', href: '/dashboard/tenant' },
  { title: 'Products', href: '/dashboard/tenant/products' },
  { title: 'Categories', href: '/dashboard/tenant/categories' },
  { title: 'Orders', href: '/dashboard/tenant/orders' },
  { title: 'Customers', href: '/dashboard/tenant/customers' },
  { title: 'Coupons', href: '/dashboard/tenant/coupons' },
  { title: 'Analytics', href: '/dashboard/tenant/analytics' },
  { title: 'Settings', href: '/dashboard/tenant/settings' },
];

export default function TenantDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && isAuthenticated && user?.tenants.length === 0) {
      // User has no tenant access
      router.push('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.tenants.length === 0 && !user?.isSuperAdmin)) {
    return null;
  }

  const currentTenant = user?.tenants[0];

  return (
    <div className="flex h-screen">
      <DashboardSidebar
        items={tenantNavItems}
        title={currentTenant?.tenantName || 'Store Admin'}
      />
      <main className="flex-1 overflow-auto bg-gray-100">{children}</main>
    </div>
  );
}

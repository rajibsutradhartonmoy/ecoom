'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';

const adminNavItems = [
  { title: 'Overview', href: '/dashboard/admin' },
  { title: 'Tenants', href: '/dashboard/admin/tenants' },
  { title: 'Users', href: '/dashboard/admin/users' },
  { title: 'Plans', href: '/dashboard/admin/plans' },
  { title: 'Billing', href: '/dashboard/admin/billing' },
  { title: 'Analytics', href: '/dashboard/admin/analytics' },
  { title: 'Settings', href: '/dashboard/admin/settings' },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && isAuthenticated && !user?.isSuperAdmin) {
      router.push('/dashboard/tenant');
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

  if (!isAuthenticated || !user?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar items={adminNavItems} title="Admin Panel" />
      <main className="flex-1 overflow-auto bg-gray-100">{children}</main>
    </div>
  );
}

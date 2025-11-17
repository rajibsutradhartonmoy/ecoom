'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-6xl font-bold mb-6">
          Welcome to <span className="text-primary">Ecoom</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Multi-Tenant Ecommerce SaaS Platform
        </p>

        {/* Auth buttons */}
        <div className="mb-12">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Welcome back, {user?.firstName}!
              </p>
              <div className="flex gap-4 justify-center">
                {user?.isSuperAdmin && (
                  <Button asChild>
                    <Link href="/dashboard/admin">Admin Dashboard</Link>
                  </Button>
                )}
                {user?.tenants && user.tenants.length > 0 && (
                  <Button asChild variant={user.isSuperAdmin ? 'outline' : 'default'}>
                    <Link href="/dashboard/tenant">Store Dashboard</Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/register">Create Account</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h2 className="text-2xl font-semibold mb-2">Super Admin</h2>
            <p className="text-muted-foreground">
              Manage tenants, subscriptions, and platform analytics.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h2 className="text-2xl font-semibold mb-2">Tenant Admin</h2>
            <p className="text-muted-foreground">
              Manage your store, products, orders, and customers.
            </p>
          </div>

          <div className="p-6 border rounded-lg hover:border-primary transition-colors">
            <h2 className="text-2xl font-semibold mb-2">Storefront</h2>
            <p className="text-muted-foreground">
              Beautiful, customizable storefronts for your customers.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-sm text-muted-foreground">
            Phase 2 Complete - Frontend Auth + Dashboard Shells
          </p>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const currentTenant = user?.tenants[0];

  return (
    <div>
      <DashboardHeader
        title="Store Dashboard"
        description={`Manage ${currentTenant?.tenantName || 'your store'}`}
      />

      <div className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">In catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">Lifetime sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Registered</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No orders yet. Share your store to start receiving orders.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Store Name</span>
                  <span className="text-sm font-medium">{currentTenant?.tenantName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Store URL</span>
                  <span className="text-sm font-medium">/store/{currentTenant?.tenantSlug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Your Role</span>
                  <span className="text-sm font-medium">{currentTenant?.role}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <h3 className="font-medium">Add Product</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a new product for your store
                  </p>
                </div>
                <div className="rounded-lg border p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <h3 className="font-medium">View Orders</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage and fulfill customer orders
                  </p>
                </div>
                <div className="rounded-lg border p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <h3 className="font-medium">Store Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure your store preferences
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

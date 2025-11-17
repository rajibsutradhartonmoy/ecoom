'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productsApi, type Product } from '@/lib/api-products';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.list({ page, limit: 10, search: search || undefined }),
  });

  const products = (data?.data as { items: Product[]; meta: { total: number; totalPages: number } })?.items || [];
  const meta = (data?.data as { items: Product[]; meta: { total: number; totalPages: number } })?.meta;

  return (
    <div>
      <DashboardHeader title="Products" description="Manage your product catalog" />

      <div className="p-6">
        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/tenant/products/new">Add Product</Link>
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading products...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Failed to load products. Please try again.</p>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first product to start selling
              </p>
              <Button asChild>
                <Link href="/dashboard/tenant/products/new">Add Product</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          product.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : product.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="font-medium">${product.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Stock</span>
                        <span className={product.stock < 10 ? 'text-red-600' : ''}>
                          {product.stock}
                        </span>
                      </div>
                      {product.category && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Category</span>
                          <span className="text-sm">{product.category.name}</span>
                        </div>
                      )}
                      {product.sku && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">SKU</span>
                          <span className="text-sm font-mono">{product.sku}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/dashboard/tenant/products/${product.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

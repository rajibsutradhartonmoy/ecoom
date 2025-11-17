'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { AddToCartButton } from '@/components/store/add-to-cart-button';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface ProductsPageProps {
  params: { slug: string };
}

export default function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = params;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['store-products', slug, search, page],
    queryFn: () =>
      apiClient.get(`/store/${slug}/products`, {
        params: {
          search: search || undefined,
          page,
          limit: 12,
        },
      }),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold">All Products</h1>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : data?.items?.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.items.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden group">
                <Link href={`/store/${slug}/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-200 overflow-hidden">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/store/${slug}/products/${product.slug}`}>
                    <h4 className="font-medium mb-2 hover:text-primary truncate">{product.name}</h4>
                  </Link>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold">{formatPrice(Number(product.price))}</span>
                    {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(Number(product.compareAtPrice))}
                      </span>
                    )}
                  </div>
                  <AddToCartButton product={product} storeSlug={slug} className="w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= data.meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No products found.</p>
        </div>
      )}
    </main>
  );
}

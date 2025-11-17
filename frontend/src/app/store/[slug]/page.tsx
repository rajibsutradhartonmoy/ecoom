'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { AddToCartButton } from '@/components/store/add-to-cart-button';

interface StorePageProps {
  params: { slug: string };
}

export default function StorePage({ params }: StorePageProps) {
  const { slug } = params;

  const { data: featured, isLoading } = useQuery({
    queryKey: ['store-featured', slug],
    queryFn: () => apiClient.get(`/store/${slug}/featured`),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          Welcome to {slug.charAt(0).toUpperCase() + slug.slice(1)}
        </h2>
        <p className="text-xl text-gray-600 mb-8">Discover our amazing products</p>
        <Link
          href={`/store/${slug}/products`}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
        >
          Shop Now
        </Link>
      </div>

      {/* Featured Products */}
      <section className="mt-16">
        <h3 className="text-2xl font-bold mb-8">Featured Products</h3>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : featured?.items?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.items.map((product: any) => (
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
                    <h4 className="font-medium mb-2 hover:text-primary">{product.name}</h4>
                  </Link>
                  <p className="text-lg font-bold mb-3">{formatPrice(Number(product.price))}</p>
                  <AddToCartButton product={product} storeSlug={slug} className="w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No featured products yet.</p>
            <Link href={`/store/${slug}/products`} className="text-primary hover:underline mt-2 inline-block">
              View all products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

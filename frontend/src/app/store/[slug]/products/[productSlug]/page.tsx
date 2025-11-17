'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { AddToCartButton } from '@/components/store/add-to-cart-button';

interface ProductDetailPageProps {
  params: { slug: string; productSlug: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, productSlug } = params;
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['store-product', slug, productSlug],
    queryFn: () => apiClient.get(`/store/${slug}/products/${productSlug}`),
  });

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href={`/store/${slug}/products`} className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
      </main>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const maxQuantity = product.trackInventory ? product.stock : 99;
  const isOutOfStock = product.trackInventory && product.stock === 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href={`/store/${slug}`} className="hover:text-gray-900">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/store/${slug}/products`} className="hover:text-gray-900">
              Products
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900">{product.name}</li>
        </ol>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="mb-6">
            <span className="text-3xl font-bold">{formatPrice(Number(product.price))}</span>
            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
              <span className="ml-3 text-lg text-gray-500 line-through">
                {formatPrice(Number(product.compareAtPrice))}
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="space-y-4 mb-8">
            {product.sku && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">SKU:</span>
                <span className="font-mono">{product.sku}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Availability:</span>
              {product.trackInventory ? (
                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
              ) : (
                <span className="text-green-600">In Stock</span>
              )}
            </div>
          </div>

          {/* Quantity */}
          {!isOutOfStock && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.min(maxQuantity, Math.max(1, val)));
                  }}
                  className="w-20 border rounded-md px-3 py-2 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <AddToCartButton
            product={product}
            quantity={quantity}
            storeSlug={slug}
            className="w-full py-6 text-lg"
          />
        </div>
      </div>
    </main>
  );
}

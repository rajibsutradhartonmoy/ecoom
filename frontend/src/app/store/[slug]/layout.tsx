'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { CartDrawer } from '@/components/store/cart-drawer';

interface StoreLayoutProps {
  children: ReactNode;
  params: { slug: string };
}

export default function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href={`/store/${slug}`} className="text-2xl font-bold text-gray-900">
              {slug.charAt(0).toUpperCase() + slug.slice(1)}
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href={`/store/${slug}`} className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
              <Link href={`/store/${slug}/products`} className="text-gray-700 hover:text-gray-900">
                Products
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <CartDrawer storeSlug={slug} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}

      {/* Footer */}
      <footer className="bg-white mt-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">
            Powered by Ecoom - Multi-Tenant Ecommerce Platform
          </p>
        </div>
      </footer>
    </div>
  );
}

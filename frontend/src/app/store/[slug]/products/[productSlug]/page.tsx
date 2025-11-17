import Link from 'next/link';

interface ProductDetailPageProps {
  params: { slug: string; productSlug: string };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug, productSlug } = params;

  // In a real implementation, this would fetch from the API
  const product = {
    id: '1',
    name: productSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    price: 149.99,
    compareAtPrice: 199.99,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    stock: 25,
    sku: 'SKU-001',
    images: [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href={`/store/${slug}`} className="text-2xl font-bold text-gray-900">
              {slug}
            </Link>
            <nav className="flex gap-6">
              <Link href={`/store/${slug}`} className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
              <Link href={`/store/${slug}/products`} className="text-gray-700 hover:text-gray-900">
                Products
              </Link>
              <Link href={`/store/${slug}/cart`} className="text-gray-700 hover:text-gray-900">
                Cart (0)
              </Link>
            </nav>
          </div>
        </div>
      </header>

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
          <div className="aspect-square bg-gray-200 rounded-lg"></div>

          {/* Info */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            <div className="mb-6">
              <span className="text-3xl font-bold">${product.price}</span>
              {product.compareAtPrice && (
                <span className="ml-3 text-lg text-gray-500 line-through">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>

            <p className="text-gray-600 mb-6">{product.description}</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">SKU:</span>
                <span className="font-mono">{product.sku}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Availability:</span>
                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                defaultValue="1"
                className="w-24 border rounded-md px-3 py-2"
              />
            </div>

            {/* Add to Cart */}
            <button className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary/90">
              Add to Cart
            </button>
          </div>
        </div>
      </main>

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

import Link from 'next/link';

interface ProductsPageProps {
  params: { slug: string };
}

export default function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = params;

  // In a real implementation, this would fetch from the API
  const products = [
    { id: '1', name: 'Wireless Headphones', price: 149.99, slug: 'wireless-headphones' },
    { id: '2', name: 'Smart Watch', price: 299.99, slug: 'smart-watch' },
    { id: '3', name: 'Classic T-Shirt', price: 24.99, slug: 'classic-t-shirt' },
    { id: '4', name: 'Running Shoes', price: 89.99, slug: 'running-shoes' },
    { id: '5', name: 'Laptop Stand', price: 59.99, slug: 'laptop-stand' },
    { id: '6', name: 'USB-C Hub', price: 49.99, slug: 'usb-c-hub' },
  ];

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
              <Link
                href={`/store/${slug}/products`}
                className="text-gray-900 font-medium"
              >
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">All Products</h1>
          <select className="border rounded-md px-3 py-2">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest</option>
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/store/${slug}/products/${product.slug}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
              <div className="p-4">
                <h3 className="font-medium mb-2">{product.name}</h3>
                <p className="text-lg font-bold">${product.price}</p>
                <button className="mt-4 w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90">
                  Add to Cart
                </button>
              </div>
            </Link>
          ))}
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

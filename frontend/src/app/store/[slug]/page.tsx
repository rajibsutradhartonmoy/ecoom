import Link from 'next/link';

interface StorePageProps {
  params: { slug: string };
}

export default function StorePage({ params }: StorePageProps) {
  const { slug } = params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">{slug}</h1>
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

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Welcome to {slug}</h2>
          <p className="text-xl text-gray-600 mb-8">Discover our amazing products</p>
          <Link
            href={`/store/${slug}/products`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Shop Now
          </Link>
        </div>

        {/* Featured Products Placeholder */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold mb-8">Featured Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4">
                <div className="aspect-square bg-gray-200 rounded-md mb-4"></div>
                <h4 className="font-medium mb-2">Product {i}</h4>
                <p className="text-gray-600 text-sm mb-2">
                  Product description goes here...
                </p>
                <p className="font-bold">$99.99</p>
              </div>
            ))}
          </div>
        </section>
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

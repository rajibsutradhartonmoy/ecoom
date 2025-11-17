export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-6xl font-bold mb-6">
          Welcome to <span className="text-primary">Ecoom</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          Multi-Tenant Ecommerce SaaS Platform
        </p>

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
            Phase 0 Complete - Monorepo Initialized
          </p>
        </div>
      </div>
    </main>
  );
}

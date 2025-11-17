import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (for development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.tenantUser.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create super admin user
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@ecoom.com';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  const superAdmin = await prisma.user.create({
    data: {
      email: superAdminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      isSuperAdmin: true,
      isVerified: true,
    },
  });

  console.log(`✅ Super admin created: ${superAdmin.email}`);

  // Create demo tenant
  const demoTenant = await prisma.tenant.create({
    data: {
      name: 'Demo Store',
      slug: 'demo-store',
      status: 'ACTIVE',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        language: 'en',
      },
    },
  });

  console.log(`✅ Demo tenant created: ${demoTenant.name}`);

  // Create tenant owner
  const tenantOwnerPassword = await bcrypt.hash('Owner123!', 12);
  const tenantOwner = await prisma.user.create({
    data: {
      email: 'owner@demo-store.com',
      passwordHash: tenantOwnerPassword,
      firstName: 'Demo',
      lastName: 'Owner',
      isVerified: true,
    },
  });

  await prisma.tenantUser.create({
    data: {
      userId: tenantOwner.id,
      tenantId: demoTenant.id,
      role: 'OWNER',
    },
  });

  console.log(`✅ Tenant owner created: ${tenantOwner.email}`);

  // Create sample categories
  const electronicsCategory = await prisma.category.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
    },
  });

  const clothingCategory = await prisma.category.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Clothing',
      slug: 'clothing',
      description: 'Apparel and fashion items',
    },
  });

  console.log('✅ Sample categories created');

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        tenantId: demoTenant.id,
        categoryId: electronicsCategory.id,
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'Premium wireless headphones with noise cancellation',
        sku: 'WH-001',
        price: 149.99,
        compareAtPrice: 199.99,
        stock: 50,
        status: 'ACTIVE',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        ],
      },
    }),
    prisma.product.create({
      data: {
        tenantId: demoTenant.id,
        categoryId: electronicsCategory.id,
        name: 'Smart Watch',
        slug: 'smart-watch',
        description: 'Feature-rich smartwatch with health monitoring',
        sku: 'SW-001',
        price: 299.99,
        stock: 30,
        status: 'ACTIVE',
        isFeatured: true,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        ],
      },
    }),
    prisma.product.create({
      data: {
        tenantId: demoTenant.id,
        categoryId: clothingCategory.id,
        name: 'Classic T-Shirt',
        slug: 'classic-t-shirt',
        description: 'Comfortable cotton t-shirt',
        sku: 'TS-001',
        price: 24.99,
        stock: 100,
        status: 'ACTIVE',
        images: [
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        ],
      },
    }),
  ]);

  console.log(`✅ ${products.length} sample products created`);

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      tenantId: demoTenant.id,
      email: 'customer@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
  });

  console.log(`✅ Sample customer created: ${customer.email}`);

  // Create sample coupon
  const coupon = await prisma.coupon.create({
    data: {
      tenantId: demoTenant.id,
      code: 'WELCOME10',
      description: '10% off your first order',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 50,
      usageLimit: 100,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  console.log(`✅ Sample coupon created: ${coupon.code}`);

  console.log('');
  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('------------------');
  console.log(`Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
  console.log(`Tenant Owner: owner@demo-store.com / Owner123!`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

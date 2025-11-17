import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/db/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      totalCustomers,
      customersThisMonth,
      totalProducts,
      lowStockProducts,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Total revenue
      this.prisma.order.aggregate({
        where: { tenantId, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      // Revenue this month
      this.prisma.order.aggregate({
        where: { tenantId, paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { total: true },
      }),
      // Revenue last month
      this.prisma.order.aggregate({
        where: {
          tenantId,
          paymentStatus: 'PAID',
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { total: true },
      }),
      // Total orders
      this.prisma.order.count({ where: { tenantId } }),
      // Orders this month
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      // Orders last month
      this.prisma.order.count({
        where: { tenantId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      // Total customers
      this.prisma.customer.count({ where: { tenantId } }),
      // New customers this month
      this.prisma.customer.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      // Total products
      this.prisma.product.count({ where: { tenantId } }),
      // Low stock products
      this.prisma.product.count({
        where: { tenantId, trackInventory: true, stock: { lte: this.prisma.product.fields.lowStockThreshold } },
      }),
      // Recent orders
      this.prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { customer: true, _count: { select: { items: true } } },
      }),
      // Top selling products
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: { order: { tenantId } },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
    ]);

    const revenueGrowth =
      revenueLastMonth._sum.total && Number(revenueLastMonth._sum.total) > 0
        ? ((Number(revenueThisMonth._sum.total || 0) - Number(revenueLastMonth._sum.total)) /
            Number(revenueLastMonth._sum.total)) *
          100
        : 0;

    const ordersGrowth =
      ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0;

    return {
      revenue: {
        total: Number(totalRevenue._sum.total || 0),
        thisMonth: Number(revenueThisMonth._sum.total || 0),
        lastMonth: Number(revenueLastMonth._sum.total || 0),
        growth: Math.round(revenueGrowth * 100) / 100,
      },
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        lastMonth: ordersLastMonth,
        growth: Math.round(ordersGrowth * 100) / 100,
      },
      customers: {
        total: totalCustomers,
        newThisMonth: customersThisMonth,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
      recentOrders,
      topProducts,
    };
  }

  async getRevenueChart(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        paymentStatus: 'PAID',
        createdAt: { gte: startDate },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const revenueByDate = new Map<string, number>();
    for (let i = 0; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const dateKey = date.toISOString().split('T')[0];
      revenueByDate.set(dateKey, 0);
    }

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const current = revenueByDate.get(dateKey) || 0;
      revenueByDate.set(dateKey, current + Number(order.total));
    });

    return Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }

  async getOrderStatusDistribution(tenantId: string) {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });

    return statuses.map((s) => ({ status: s.status, count: s._count.status }));
  }
}

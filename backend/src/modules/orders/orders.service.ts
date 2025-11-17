import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/lib/db/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  async create(tenantId: string, dto: CreateOrderDto) {
    // Validate products and calculate totals
    const orderItems: Array<{
      productId: string;
      productName: string;
      productSku: string | null;
      quantity: number;
      unitPrice: number;
      total: number;
    }> = [];

    let subtotal = 0;

    for (const item of dto.items) {
      const product = await this.productsService.findOne(tenantId, item.productId);

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(`Product ${product.name} is not available`);
      }

      if (product.trackInventory && product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: Number(product.price),
        total: itemTotal,
      });
    }

    // Handle coupon (simplified - just validate exists)
    let discount = 0;
    let couponId: string | null = null;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { tenantId_code: { tenantId, code: dto.couponCode } },
      });

      if (coupon && coupon.isActive && new Date() <= coupon.expiresAt) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = subtotal * (Number(coupon.discountValue) / 100);
          if (coupon.maxDiscount) {
            discount = Math.min(discount, Number(coupon.maxDiscount));
          }
        } else {
          discount = Number(coupon.discountValue);
        }
        couponId = coupon.id;
      }
    }

    // Calculate totals (simplified - no tax/shipping for now)
    const shippingCost = 0;
    const taxAmount = 0;
    const total = subtotal - discount + shippingCost + taxAmount;

    // Create or find customer
    let customer = await this.prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email: dto.customer.email } },
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          tenantId,
          email: dto.customer.email,
          firstName: dto.customer.firstName,
          lastName: dto.customer.lastName,
          phone: dto.customer.phone,
          addressLine1: dto.shippingAddress.line1,
          addressLine2: dto.shippingAddress.line2,
          city: dto.shippingAddress.city,
          state: dto.shippingAddress.state,
          postalCode: dto.shippingAddress.postalCode,
          country: dto.shippingAddress.country,
        },
      });
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber(tenantId);

    // Create order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          customerId: customer.id,
          orderNumber,
          subtotal,
          shippingCost,
          taxAmount,
          discount,
          total,
          couponId,
          couponCode: dto.couponCode,
          notes: dto.notes,
          shippingAddressLine1: dto.shippingAddress.line1,
          shippingAddressLine2: dto.shippingAddress.line2,
          shippingCity: dto.shippingAddress.city,
          shippingState: dto.shippingAddress.state,
          shippingPostalCode: dto.shippingAddress.postalCode,
          shippingCountry: dto.shippingAddress.country,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          customer: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      });

      // Update product stock
      for (const item of orderItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product && product.trackInventory) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Update customer stats
      await tx.customer.update({
        where: { id: customer.id },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
        },
      });

      // Update coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    this.logger.log(`Order created: ${order.orderNumber} for tenant ${tenantId}`);

    return order;
  }

  async findAll(tenantId: string, query: OrderQueryDto) {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      customerId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { tenantId };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const total = await this.prisma.order.count({ where });

    const orders = await this.prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        _count: { select: { items: true } },
      },
    });

    return {
      items: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: true },
            },
          },
        },
        coupon: {
          select: { id: true, code: true, discountType: true, discountValue: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    if (dto.status) {
      this.validateStatusTransition(order.status, dto.status);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.notes && { notes: dto.notes }),
      },
      include: {
        customer: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    this.logger.log(`Order ${id} status updated to ${dto.status}`);

    return updated;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELED'],
      CONFIRMED: ['PROCESSING', 'CANCELED'],
      PROCESSING: ['SHIPPED', 'CANCELED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['REFUNDED'],
      CANCELED: [],
      REFUNDED: [],
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.order.count({ where: { tenantId } });
    const timestamp = Date.now().toString(36).toUpperCase();
    const sequence = (count + 1).toString().padStart(5, '0');
    return `ORD-${timestamp}-${sequence}`;
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/lib/db/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { search?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { search, isActive, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { orders: true } } },
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(tenantId: string, id: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { orders: true } } },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async create(tenantId: string, data: {
    code: string;
    description?: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number;
    usageLimit?: number;
    startsAt: Date;
    expiresAt: Date;
  }) {
    // Check if code already exists for this tenant
    const existing = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: data.code.toUpperCase() } },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        tenantId,
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
      },
    });
  }

  async update(tenantId: string, id: string, data: Partial<{
    description: string;
    discountValue: number;
    minPurchase: number;
    maxDiscount: number;
    usageLimit: number;
    startsAt: Date;
    expiresAt: Date;
    isActive: boolean;
  }>) {
    await this.findById(tenantId, id);

    return this.prisma.coupon.update({
      where: { id },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findById(tenantId, id);

    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(tenantId: string, code: string, orderTotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { tenantId_code: { tenantId, code: code.toUpperCase() } },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is no longer active');
    }

    const now = new Date();
    if (now < coupon.startsAt) {
      throw new BadRequestException('Coupon is not yet valid');
    }

    if (now > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    if (coupon.minPurchase && orderTotal < Number(coupon.minPurchase)) {
      throw new BadRequestException(`Minimum purchase of $${coupon.minPurchase} required`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = orderTotal * (Number(coupon.discountValue) / 100);
    } else {
      discount = Number(coupon.discountValue);
    }

    // Apply max discount cap
    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }

    // Don't exceed order total
    discount = Math.min(discount, orderTotal);

    return {
      valid: true,
      coupon,
      discount: Math.round(discount * 100) / 100,
    };
  }

  async applyCoupon(couponId: string) {
    return this.prisma.coupon.update({
      where: { id: couponId },
      data: { usageCount: { increment: 1 } },
    });
  }
}

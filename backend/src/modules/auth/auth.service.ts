import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/lib/db/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload, JwtRefreshPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.isSuperAdmin, []);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        tenants: [],
      },
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        tenantUsers: {
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Map tenant data
    const tenants = user.tenantUsers.map((tu) => ({
      tenantId: tu.tenantId,
      tenantName: tu.tenant.name,
      tenantSlug: tu.tenant.slug,
      role: tu.role,
    }));

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.isSuperAdmin,
      tenants.map((t) => ({ tenantId: t.tenantId, role: t.role })),
    );

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        tenants,
      },
    };
  }

  async refreshTokens(userId: string, oldRefreshTokenId: string) {
    // Get user with tenant info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenantUsers: {
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Revoke old refresh token (token rotation)
    await this.prisma.refreshToken.update({
      where: { id: oldRefreshTokenId },
      data: { revokedAt: new Date() },
    });

    // Map tenant data
    const tenants = user.tenantUsers.map((tu) => ({
      tenantId: tu.tenantId,
      tenantName: tu.tenant.name,
      tenantSlug: tu.tenant.slug,
      role: tu.role,
    }));

    // Generate new tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.isSuperAdmin,
      tenants.map((t) => ({ tenantId: t.tenantId, role: t.role })),
    );

    this.logger.log(`Tokens refreshed for user: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        tenants,
      },
    };
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`User logged out: ${userId}`);

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isSuperAdmin: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        tenantUsers: {
          select: {
            tenantId: true,
            role: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tenants = user.tenantUsers.map((tu) => ({
      tenantId: tu.tenantId,
      tenantName: tu.tenant.name,
      tenantSlug: tu.tenant.slug,
      tenantStatus: tu.tenant.status,
      role: tu.role,
    }));

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isSuperAdmin: user.isSuperAdmin,
      isVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      tenants,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    isSuperAdmin: boolean,
    tenants: Array<{ tenantId: string; role: string }>,
  ) {
    // Create refresh token record first
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpiry(expiresIn);

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        userId,
        token: '', // Will update after signing
        expiresAt,
      },
    });

    // Create JWT payloads
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      isSuperAdmin,
      tenants,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: userId,
      tokenId: refreshTokenRecord.id,
    };

    // Sign tokens
    const accessToken = this.jwtService.sign(accessPayload);

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Update refresh token record with actual token
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private calculateExpiry(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Default to 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}

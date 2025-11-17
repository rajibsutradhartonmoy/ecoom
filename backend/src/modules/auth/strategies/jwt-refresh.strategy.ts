import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '@/lib/db/prisma.service';
import { JwtRefreshPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtRefreshPayload) {
    const refreshToken = req.body.refreshToken;

    // Check if token exists and is not revoked
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: payload.tokenId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isSuperAdmin: true,
            isActive: true,
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
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    const tenants = tokenRecord.user.tenantUsers.map((tu) => ({
      tenantId: tu.tenantId,
      tenantName: tu.tenant.name,
      tenantSlug: tu.tenant.slug,
      role: tu.role,
    }));

    return {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      firstName: tokenRecord.user.firstName,
      lastName: tokenRecord.user.lastName,
      isSuperAdmin: tokenRecord.user.isSuperAdmin,
      tenants,
      refreshTokenId: tokenRecord.id,
    };
  }
}

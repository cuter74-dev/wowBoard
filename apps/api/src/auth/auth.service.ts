import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { OAuthProfile } from './oauth-profile';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Upsert a user from a social profile and return the DB record. */
  async upsertFromProfile(profile: OAuthProfile) {
    return this.prisma.user.upsert({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      update: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      create: {
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
    });
  }

  /** Shared guest account for "enter without login" / demo access. */
  async upsertGuest() {
    return this.prisma.user.upsert({
      where: {
        provider_providerId: { provider: 'GUEST', providerId: 'guest' },
      },
      update: {},
      create: {
        provider: 'GUEST',
        providerId: 'guest',
        name: '게스트',
        email: null,
      },
    });
  }

  signToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

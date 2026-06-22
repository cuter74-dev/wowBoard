import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
// passport-naver-v2 has no types; declared in src/types/passport-naver-v2.d.ts
import { Strategy } from 'passport-naver-v2';
import type { OAuthProfile } from '../oauth-profile';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('NAVER_CLIENT_ID') || 'unconfigured',
      clientSecret: config.get<string>('NAVER_CLIENT_SECRET') || 'unconfigured',
      callbackURL: config.get<string>('NAVER_CALLBACK_URL'),
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: unknown, user?: OAuthProfile) => void,
  ): void {
    const result: OAuthProfile = {
      provider: 'NAVER',
      providerId: String(profile.id),
      email: profile.email ?? null,
      name: profile.name ?? profile.nickname ?? null,
      avatarUrl: profile.profileImage ?? null,
    };
    done(null, result);
  }
}

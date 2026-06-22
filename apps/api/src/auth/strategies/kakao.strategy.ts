import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
// passport-kakao has no types; declared in src/types/passport-kakao.d.ts
import { Strategy } from 'passport-kakao';
import type { OAuthProfile } from '../oauth-profile';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('KAKAO_CLIENT_ID') || 'unconfigured',
      clientSecret: config.get<string>('KAKAO_CLIENT_SECRET') || '',
      callbackURL: config.get<string>('KAKAO_CALLBACK_URL'),
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: (err: unknown, user?: OAuthProfile) => void,
  ): void {
    const account = profile?._json?.kakao_account ?? {};
    const result: OAuthProfile = {
      provider: 'KAKAO',
      providerId: String(profile.id),
      email: account.email ?? null,
      name: account.profile?.nickname ?? profile.displayName ?? null,
      avatarUrl: account.profile?.profile_image_url ?? null,
    };
    done(null, result);
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
// passport-apple has no types; declared in src/types/passport-apple.d.ts
import { Strategy } from 'passport-apple';
import type { OAuthProfile } from '../oauth-profile';

/** Decode the (already-verified) Apple id_token payload without re-verifying. */
function decodeIdToken(idToken: unknown): Record<string, any> {
  if (idToken && typeof idToken === 'object') return idToken as Record<string, any>;
  if (typeof idToken !== 'string') return {};
  try {
    const payload = idToken.split('.')[1];
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('APPLE_CLIENT_ID') || 'unconfigured',
      teamID: config.get<string>('APPLE_TEAM_ID') || 'unconfigured',
      keyID: config.get<string>('APPLE_KEY_ID') || 'unconfigured',
      callbackURL: config.get<string>('APPLE_CALLBACK_URL'),
      privateKeyLocation: config.get<string>('APPLE_PRIVATE_KEY_PATH'),
      passReqToCallback: false,
      scope: ['name', 'email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    idToken: unknown,
    _profile: unknown,
    done: (err: unknown, user?: OAuthProfile) => void,
  ): void {
    const claims = decodeIdToken(idToken);
    const result: OAuthProfile = {
      provider: 'APPLE',
      providerId: claims.sub ?? '',
      email: claims.email ?? null,
      name: null,
      avatarUrl: null,
    };
    done(null, result);
  }
}

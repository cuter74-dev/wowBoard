import type { Provider } from '@prisma/client';

/** Normalized profile produced by every social strategy's validate(). */
export interface OAuthProfile {
  provider: Provider;
  providerId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

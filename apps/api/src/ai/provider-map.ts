import { AiProvider } from '@prisma/client';
import type { AiProviderKind } from '@wowboard/shared';

export function toEnum(kind: AiProviderKind): AiProvider {
  return kind.toUpperCase() as AiProvider;
}

export function toKind(provider: AiProvider): AiProviderKind {
  return provider.toLowerCase() as AiProviderKind;
}

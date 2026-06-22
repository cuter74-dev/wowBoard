import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AiProviderKind } from '@wowboard/shared';
import { AI_DEFAULT_MODEL } from '@wowboard/shared';
import { PrismaService } from '../prisma/prisma.service';
import { encrypt, decrypt } from './crypto.util';
import { toEnum, toKind } from './provider-map';
import { UpsertCredentialDto } from './dto';

export interface ResolvedCredential {
  kind: AiProviderKind;
  apiKey: string;
  baseUrl: string | null;
  model: string;
}

@Injectable()
export class CredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Masked list for the settings UI — never returns the key. */
  async list(userId: string) {
    const rows = await this.prisma.aiCredential.findMany({ where: { userId } });
    return rows.map((r) => ({
      provider: toKind(r.provider),
      hasKey: r.keyCipher.length > 0,
      baseUrl: r.baseUrl,
      model: r.model,
    }));
  }

  /** Providers usable for generation (have a key, or LOCAL with a baseUrl). */
  async configuredKinds(userId: string): Promise<AiProviderKind[]> {
    const rows = await this.prisma.aiCredential.findMany({ where: { userId } });
    return rows
      .filter((r) =>
        r.provider === 'LOCAL' ? !!r.baseUrl : r.keyCipher.length > 0,
      )
      .map((r) => toKind(r.provider));
  }

  async upsert(userId: string, kind: AiProviderKind, dto: UpsertCredentialDto) {
    const provider = toEnum(kind);
    const existing = await this.prisma.aiCredential.findUnique({
      where: { userId_provider: { userId, provider } },
    });

    // Only re-encrypt when a new key is provided; keep prior key otherwise.
    const keyCipher =
      dto.apiKey !== undefined
        ? encrypt(dto.apiKey)
        : (existing?.keyCipher ?? '');

    await this.prisma.aiCredential.upsert({
      where: { userId_provider: { userId, provider } },
      update: { keyCipher, baseUrl: dto.baseUrl ?? existing?.baseUrl, model: dto.model ?? existing?.model },
      create: { userId, provider, keyCipher, baseUrl: dto.baseUrl, model: dto.model },
    });
    return { ok: true };
  }

  async remove(userId: string, kind: AiProviderKind) {
    await this.prisma.aiCredential
      .delete({ where: { userId_provider: { userId, provider: toEnum(kind) } } })
      .catch(() => {
        throw new NotFoundException();
      });
    return { ok: true };
  }

  /** Decrypted credential for actually calling the provider. */
  async resolve(userId: string, kind: AiProviderKind): Promise<ResolvedCredential> {
    const row = await this.prisma.aiCredential.findUnique({
      where: { userId_provider: { userId, provider: toEnum(kind) } },
    });
    if (!row) {
      throw new BadRequestException(
        `${kind} 자격증명이 없습니다. 설정에서 API 키를 등록하세요.`,
      );
    }
    const apiKey = decrypt(row.keyCipher);
    if (kind === 'local') {
      if (!row.baseUrl) {
        throw new BadRequestException('로컬 엔드포인트(baseUrl)를 설정하세요.');
      }
    } else if (!apiKey) {
      throw new BadRequestException(
        `${kind} API 키가 없습니다. 설정에서 등록하세요.`,
      );
    }
    return {
      kind,
      apiKey,
      baseUrl: row.baseUrl,
      model: row.model || AI_DEFAULT_MODEL[kind],
    };
  }
}

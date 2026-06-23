import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_SCREEN,
  type AiProviderKind,
  type ElementInput,
} from '@wowboard/shared';
import { CredentialsService, type ResolvedCredential } from './credentials.service';
import { sanitize, type SanitizedScreen } from './sanitize';
import type { AiGenProvider } from './providers/provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly credentials: CredentialsService) {}

  private build(cred: ResolvedCredential): AiGenProvider {
    switch (cred.kind) {
      case 'anthropic':
        return new AnthropicProvider(cred.apiKey, cred.model);
      case 'gemini':
        return new GeminiProvider(cred.apiKey, cred.model);
      case 'openai':
      case 'local':
        return new OpenAiProvider(cred.apiKey, cred.model, cred.baseUrl);
    }
  }

  private wrap(err: unknown, cred: ResolvedCredential): never {
    const msg = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number })?.status;
    const where =
      cred.kind === 'local' || cred.baseUrl
        ? ` @ ${cred.baseUrl ?? '(default)'}`
        : '';
    let hint = '';
    if (status === 404) {
      hint =
        ' — 모델 이름이 올바른지(설정의 모델 필드), 로컬이면 엔드포인트 URL(예: …/v1)이 맞는지 확인하세요.';
    } else if (status === 401 || status === 403) {
      hint = ' — API 키가 유효한지 확인하세요.';
    } else if (err instanceof SyntaxError || /JSON/i.test(msg)) {
      hint =
        ' — 모델이 올바른 JSON을 내지 못했습니다(출력이 잘렸거나 형식 오류). 더 크거나 지시를 잘 따르는 모델을 쓰거나, 프롬프트를 더 단순하게 해보세요.';
    }
    this.logger.warn(`AI call failed [${cred.kind}/${cred.model}${where}]: ${msg}`);
    throw new BadRequestException(
      `AI 생성 실패 [${cred.kind} · ${cred.model}${where}]: ${msg}${hint}`,
    );
  }

  /** Compose the user prompt, folding in the current screen as edit/add context. */
  private composePrompt(
    prompt: string,
    mode: 'add' | 'edit',
    current?: ElementInput[],
  ): string {
    if (!current || current.length === 0) return prompt;
    const ctx = `\n\nThe screen currently contains these elements (JSON):\n${JSON.stringify(
      current.map(({ type, x, y, width, height, props }) => ({ type, x, y, width, height, props })),
    )}`;
    const instruction =
      mode === 'edit'
        ? '\n\nModify the screen to satisfy the request. Return the COMPLETE updated element list, including unchanged elements, as the full new screen.'
        : '\n\nADD elements to satisfy the request. Return ONLY the new elements to add — do not repeat existing ones. Place them so they do not overlap the existing elements.';
    return `${prompt}${ctx}${instruction}`;
  }

  async generate(
    userId: string,
    kind: AiProviderKind,
    prompt: string,
    size: { width: number; height: number },
    opts?: {
      mode?: 'add' | 'edit';
      current?: ElementInput[];
      image?: { data: string; mime: string };
    },
  ): Promise<SanitizedScreen> {
    const cred = await this.credentials.resolve(userId, kind);
    let finalPrompt = this.composePrompt(prompt, opts?.mode ?? 'add', opts?.current);
    if (opts?.image) {
      finalPrompt +=
        '\n\nA reference image is attached. Use it as a visual reference for the layout/style.';
    }
    try {
      const raw = await this.build(cred).generate(finalPrompt, size, opts?.image);
      return sanitize(raw, size);
    } catch (err) {
      this.wrap(err, cred);
    }
  }

  async fromImage(
    userId: string,
    kind: AiProviderKind,
    imageB64: string,
    mime: string,
    size: { width: number; height: number } = DEFAULT_SCREEN,
  ): Promise<SanitizedScreen> {
    const cred = await this.credentials.resolve(userId, kind);
    try {
      const raw = await this.build(cred).fromImage(imageB64, mime, size);
      // User picked the frame explicitly — force it over any AI-inferred size.
      raw.screen = undefined;
      return sanitize(raw, size);
    } catch (err) {
      this.wrap(err, cred);
    }
  }
}

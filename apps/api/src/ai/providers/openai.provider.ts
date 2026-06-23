import OpenAI from 'openai';
import {
  AI_SYSTEM_PROMPT,
  AI_IMAGE_PROMPT,
  AI_ELEMENT_SCHEMA,
  type AiRawOutput,
} from '@wowboard/shared';
import {
  type AiGenProvider,
  type ScreenSize,
  type RefImage,
  parseJsonLoose,
  schemaHint,
} from './provider.interface';

/**
 * The OpenAI SDK appends "/chat/completions" to baseURL itself. Users often
 * paste the full endpoint, which would double the path → 404. Normalize by
 * trimming a trailing "/chat/completions" (and slashes).
 */
function normalizeBaseUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const s = u
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/completions$/i, '')
    .replace(/\/+$/, '');
  return s || undefined;
}

/** OpenAI GPT and any OpenAI-compatible local endpoint (baseUrl override). */
export class OpenAiProvider implements AiGenProvider {
  private client: OpenAI;
  private system: string;
  constructor(
    apiKey: string,
    private readonly model: string,
    baseUrl?: string | null,
  ) {
    // Local endpoints may not require a real key; send a placeholder.
    this.client = new OpenAI({
      apiKey: apiKey || 'local',
      baseURL: normalizeBaseUrl(baseUrl),
    });
    this.system = AI_SYSTEM_PROMPT + schemaHint(AI_ELEMENT_SCHEMA);
  }

  private async call(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    jsonMode: boolean,
  ): Promise<{ content: string; reasoning: string; finishReason?: string | null }> {
    const res = await this.client.chat.completions.create({
      model: this.model,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      max_tokens: 16000,
    });
    const choice = res.choices?.[0];
    const msg = (choice?.message ?? {}) as {
      content?: string | null;
      reasoning?: string;
      reasoning_content?: string;
    };
    return {
      content: msg.content ?? '',
      // Reasoning models (e.g. minimax via Ollama) put output in `reasoning`.
      reasoning: msg.reasoning ?? msg.reasoning_content ?? '',
      finishReason: choice?.finish_reason,
    };
  }

  private async run(userContent: OpenAI.Chat.ChatCompletionUserMessageParam['content']): Promise<AiRawOutput> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.system },
      { role: 'user', content: userContent },
    ];

    // Some OpenAI-compatible local servers return empty content in json_object
    // mode. Fall back to a plain completion (the prompt already demands JSON).
    let { content, reasoning, finishReason } = await this.call(messages, true);
    if (!content.trim()) {
      ({ content, reasoning, finishReason } = await this.call(messages, false));
    }

    // Last resort: reasoning models may emit the JSON into the reasoning field
    // and leave content empty — try to recover JSON from there.
    const text = content.trim() || reasoning.trim();
    if (!text) {
      throw new Error(
        `모델이 빈 응답을 반환했습니다 (finish_reason: ${finishReason}). content와 reasoning 모두 비어 있습니다 — 다른 모델/엔드포인트를 사용하세요.`,
      );
    }
    return parseJsonLoose(text);
  }

  generate(prompt: string, screen: ScreenSize, image?: RefImage): Promise<AiRawOutput> {
    const text = `Screen size: ${screen.width}x${screen.height}.\nRequest: ${prompt}`;
    if (!image) return this.run(text);
    return this.run([
      { type: 'text', text },
      { type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.data}` } },
    ]);
  }

  fromImage(imageB64: string, mime: string, screen: ScreenSize): Promise<AiRawOutput> {
    return this.run([
      {
        type: 'text',
        text: `${AI_IMAGE_PROMPT}\n\nTarget screen size: ${screen.width}x${screen.height}. Scale the layout to fit this frame.`,
      },
      { type: 'image_url', image_url: { url: `data:${mime};base64,${imageB64}` } },
    ]);
  }
}

import Anthropic from '@anthropic-ai/sdk';
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
} from './provider.interface';

export class AnthropicProvider implements AiGenProvider {
  private client: Anthropic;
  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey });
  }

  private text(res: Anthropic.Message): string {
    const block = res.content.find((b) => b.type === 'text');
    return block && block.type === 'text' ? block.text : '';
  }

  private async run(content: Anthropic.MessageParam['content']): Promise<AiRawOutput> {
    // output_config.format constrains the response to our schema (cast: the
    // field may not be in this SDK version's static types).
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 8000,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
      output_config: { format: { type: 'json_schema', schema: AI_ELEMENT_SCHEMA } },
    } as unknown as Anthropic.MessageCreateParamsNonStreaming);
    return parseJsonLoose(this.text(res));
  }

  private imageBlock(data: string, mime: string) {
    return {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mime as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
        data,
      },
    };
  }

  generate(prompt: string, screen: ScreenSize, image?: RefImage): Promise<AiRawOutput> {
    const text = `Screen size: ${screen.width}x${screen.height}.\nRequest: ${prompt}`;
    if (!image) return this.run(text);
    return this.run([this.imageBlock(image.data, image.mime), { type: 'text', text }]);
  }

  fromImage(imageB64: string, mime: string, screen: ScreenSize): Promise<AiRawOutput> {
    return this.run([
      this.imageBlock(imageB64, mime),
      {
        type: 'text',
        text: `${AI_IMAGE_PROMPT}\n\nTarget screen size: ${screen.width}x${screen.height}. Scale the layout to fit this frame.`,
      },
    ]);
  }
}

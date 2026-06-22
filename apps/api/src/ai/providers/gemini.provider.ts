import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AI_SYSTEM_PROMPT,
  AI_IMAGE_PROMPT,
  AI_ELEMENT_SCHEMA,
  type AiRawOutput,
} from '@wowboard/shared';
import {
  type AiGenProvider,
  type ScreenSize,
  parseJsonLoose,
  schemaHint,
} from './provider.interface';

export class GeminiProvider implements AiGenProvider {
  private model;
  private system: string;
  constructor(apiKey: string, modelName: string) {
    this.system = AI_SYSTEM_PROMPT + schemaHint(AI_ELEMENT_SCHEMA);
    this.model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });
  }

  async generate(prompt: string, screen: ScreenSize): Promise<AiRawOutput> {
    const res = await this.model.generateContent(
      `${this.system}\n\nScreen size: ${screen.width}x${screen.height}.\nRequest: ${prompt}`,
    );
    return parseJsonLoose(res.response.text());
  }

  async fromImage(imageB64: string, mime: string, screen: ScreenSize): Promise<AiRawOutput> {
    const res = await this.model.generateContent([
      {
        text: `${this.system}\n\n${AI_IMAGE_PROMPT}\n\nTarget screen size: ${screen.width}x${screen.height}. Scale the layout to fit this frame.`,
      },
      { inlineData: { mimeType: mime, data: imageB64 } },
    ]);
    return parseJsonLoose(res.response.text());
  }
}

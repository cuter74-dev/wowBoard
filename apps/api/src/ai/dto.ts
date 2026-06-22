import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { AiProviderKind, ElementInput } from '@wowboard/shared';

const KINDS = ['openai', 'anthropic', 'gemini', 'local'];

export class UpsertCredentialDto {
  @IsOptional()
  @IsString()
  @MaxLength(400)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;
}

export class GenerateDto {
  @IsIn(KINDS)
  provider!: AiProviderKind;

  @IsString()
  @MaxLength(4000)
  prompt!: string;

  @IsOptional()
  @IsInt()
  @Min(50)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  height?: number;

  // 'add' = append new elements; 'edit' = rewrite the whole screen.
  @IsOptional()
  @IsIn(['add', 'edit'])
  mode?: 'add' | 'edit';

  // Existing screen elements, passed as context so the AI can edit/extend.
  @IsOptional()
  @IsArray()
  current?: ElementInput[];
}

export class FromImageDto {
  @IsIn(KINDS)
  provider!: AiProviderKind;

  @IsString()
  // base64 string (no data: prefix). ~8MB cap to bound request size.
  @MaxLength(11_000_000)
  imageBase64!: string;

  @IsString()
  @IsIn(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
  mime!: string;

  @IsOptional()
  @IsInt()
  @Min(50)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  height?: number;
}

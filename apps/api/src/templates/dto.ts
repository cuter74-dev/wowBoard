import { IsArray, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import type { ElementInput } from '@wowboard/shared';

export class CreateTemplateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsInt()
  @Min(50)
  width!: number;

  @IsInt()
  @Min(50)
  height!: number;

  @IsArray()
  elements!: ElementInput[];
}

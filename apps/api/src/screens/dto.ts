import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateScreenDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(50)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  height?: number;
}

export class UpdateScreenDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(50)
  height?: number;
}

export class ElementInputDto {
  @IsString()
  type!: string;

  @IsInt()
  x!: number;

  @IsInt()
  y!: number;

  @IsInt()
  @Min(1)
  width!: number;

  @IsInt()
  @Min(1)
  height!: number;

  @IsInt()
  zIndex!: number;

  @IsObject()
  props!: Record<string, unknown>;
}

export class PutElementsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElementInputDto)
  elements!: ElementInputDto[];
}

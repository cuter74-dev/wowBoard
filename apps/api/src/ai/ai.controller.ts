import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { DEFAULT_SCREEN, type AiProviderKind } from '@wowboard/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CredentialsService } from './credentials.service';
import { AiService } from './ai.service';
import { UpsertCredentialDto, GenerateDto, FromImageDto } from './dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly ai: AiService,
  ) {}

  // ───────── credentials (BYOK) ─────────
  @Get('credentials')
  listCredentials(@CurrentUser() user: User) {
    return this.credentials.list(user.id);
  }

  @Put('credentials/:provider')
  upsertCredential(
    @CurrentUser() user: User,
    @Param('provider') provider: AiProviderKind,
    @Body() dto: UpsertCredentialDto,
  ) {
    return this.credentials.upsert(user.id, provider, dto);
  }

  @Delete('credentials/:provider')
  removeCredential(
    @CurrentUser() user: User,
    @Param('provider') provider: AiProviderKind,
  ) {
    return this.credentials.remove(user.id, provider);
  }

  // ───────── usable providers (have a key) ─────────
  @Get('providers')
  providers(@CurrentUser() user: User) {
    return this.credentials.configuredKinds(user.id);
  }

  // ───────── generation ─────────
  @Post('generate')
  generate(@CurrentUser() user: User, @Body() dto: GenerateDto) {
    return this.ai.generate(
      user.id,
      dto.provider,
      dto.prompt,
      {
        width: dto.width ?? DEFAULT_SCREEN.width,
        height: dto.height ?? DEFAULT_SCREEN.height,
      },
      { mode: dto.mode ?? 'add', current: dto.current },
    );
  }

  @Post('from-image')
  fromImage(@CurrentUser() user: User, @Body() dto: FromImageDto) {
    return this.ai.fromImage(user.id, dto.provider, dto.imageBase64, dto.mime, {
      width: dto.width ?? DEFAULT_SCREEN.width,
      height: dto.height ?? DEFAULT_SCREEN.height,
    });
  }
}

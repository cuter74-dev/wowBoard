import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: User) {
    return this.templates.list(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateTemplateDto) {
    return this.templates.create(user.id, dto);
  }

  // ───────── sharing (declared before :id routes) ─────────
  @Get('shared/:token') // public
  getShared(@Param('token') token: string) {
    return this.templates.getByToken(token);
  }

  @Post('import/:token')
  @UseGuards(JwtAuthGuard)
  importShared(@CurrentUser() user: User, @Param('token') token: string) {
    return this.templates.importByToken(user.id, token);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  share(@CurrentUser() user: User, @Param('id') id: string) {
    return this.templates.enableShare(user.id, id);
  }

  @Delete(':id/share')
  @UseGuards(JwtAuthGuard)
  unshare(@CurrentUser() user: User, @Param('id') id: string) {
    return this.templates.disableShare(user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templates.update(user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.templates.remove(user.id, id);
  }
}

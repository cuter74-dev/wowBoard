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
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.templates.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateTemplateDto) {
    return this.templates.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templates.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.templates.remove(user.id, id);
  }
}

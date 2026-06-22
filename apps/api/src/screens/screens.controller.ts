import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ScreensService } from './screens.service';
import { CreateScreenDto, PutElementsDto, UpdateScreenDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ScreensController {
  constructor(private readonly screens: ScreensService) {}

  @Post('projects/:projectId/screens')
  create(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() dto: CreateScreenDto,
  ) {
    return this.screens.create(user.id, projectId, dto);
  }

  @Patch('screens/:id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateScreenDto,
  ) {
    return this.screens.update(user.id, id, dto);
  }

  @Delete('screens/:id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.screens.remove(user.id, id);
  }

  @Put('screens/:id/elements')
  putElements(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: PutElementsDto,
  ) {
    return this.screens.putElements(user.id, id, dto);
  }
}

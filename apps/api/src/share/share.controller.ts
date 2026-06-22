import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ShareService } from './share.service';

@Controller()
export class ShareController {
  constructor(private readonly share: ShareService) {}

  @Post('projects/:id/share')
  @UseGuards(JwtAuthGuard)
  enable(@CurrentUser() user: User, @Param('id') id: string) {
    return this.share.enable(user.id, id);
  }

  @Delete('projects/:id/share')
  @UseGuards(JwtAuthGuard)
  disable(@CurrentUser() user: User, @Param('id') id: string) {
    return this.share.disable(user.id, id);
  }

  // Public — no auth guard.
  @Get('share/:token')
  getByToken(@Param('token') token: string) {
    return this.share.getByToken(token);
  }
}

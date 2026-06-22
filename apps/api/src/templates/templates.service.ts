import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.template.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        userId,
        name: dto.name,
        width: dto.width,
        height: dto.height,
        elements: dto.elements as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateTemplateDto) {
    await this.assertOwner(userId, id);
    return this.prisma.template.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.template.delete({ where: { id } });
    return { ok: true };
  }

  // ───────── cross-account sharing ─────────
  async enableShare(userId: string, id: string) {
    await this.assertOwner(userId, id);
    const existing = await this.prisma.template.findUnique({
      where: { id },
      select: { shareToken: true },
    });
    if (existing?.shareToken) return { shareToken: existing.shareToken };
    const shareToken = randomBytes(16).toString('hex');
    await this.prisma.template.update({ where: { id }, data: { shareToken } });
    return { shareToken };
  }

  async disableShare(userId: string, id: string) {
    await this.assertOwner(userId, id);
    await this.prisma.template.update({
      where: { id },
      data: { shareToken: null },
    });
    return { ok: true };
  }

  /** Public read-only fetch of a shared template by token. */
  async getByToken(token: string) {
    const tpl = await this.prisma.template.findUnique({
      where: { shareToken: token },
    });
    if (!tpl) throw new NotFoundException('공유된 템플릿을 찾을 수 없습니다.');
    return { name: tpl.name, width: tpl.width, height: tpl.height, elements: tpl.elements };
  }

  /** Copy a shared template into the caller's own templates. */
  async importByToken(userId: string, token: string) {
    const tpl = await this.prisma.template.findUnique({
      where: { shareToken: token },
    });
    if (!tpl) throw new NotFoundException('공유된 템플릿을 찾을 수 없습니다.');
    return this.prisma.template.create({
      data: {
        userId,
        name: tpl.name,
        width: tpl.width,
        height: tpl.height,
        elements: tpl.elements as Prisma.InputJsonValue,
      },
    });
  }

  private async assertOwner(userId: string, id: string) {
    const tpl = await this.prisma.template.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!tpl) throw new NotFoundException();
    if (tpl.userId !== userId) throw new ForbiddenException();
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
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

  private async assertOwner(userId: string, id: string) {
    const tpl = await this.prisma.template.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!tpl) throw new NotFoundException();
    if (tpl.userId !== userId) throw new ForbiddenException();
  }
}

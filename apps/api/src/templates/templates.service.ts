import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto';

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

  async remove(userId: string, id: string) {
    const tpl = await this.prisma.template.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!tpl) throw new NotFoundException();
    if (tpl.userId !== userId) throw new ForbiddenException();
    await this.prisma.template.delete({ where: { id } });
    return { ok: true };
  }
}

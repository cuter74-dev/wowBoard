import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScreenDto, PutElementsDto, UpdateScreenDto } from './dto';

@Injectable()
export class ScreensService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, projectId: string, dto: CreateScreenDto) {
    await this.assertProjectOwner(ownerId, projectId);
    // New screens inherit the project's default size unless overridden.
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { defaultWidth: true, defaultHeight: true },
    });
    const count = await this.prisma.screen.count({ where: { projectId } });
    return this.prisma.screen.create({
      data: {
        projectId,
        name: dto.name ?? `화면 ${count + 1}`,
        order: count,
        width: dto.width ?? project?.defaultWidth ?? 390,
        height: dto.height ?? project?.defaultHeight ?? 844,
      },
      include: { elements: true },
    });
  }

  async update(ownerId: string, screenId: string, dto: UpdateScreenDto) {
    await this.assertScreenOwner(ownerId, screenId);
    return this.prisma.screen.update({ where: { id: screenId }, data: dto });
  }

  async remove(ownerId: string, screenId: string) {
    await this.assertScreenOwner(ownerId, screenId);
    await this.prisma.screen.delete({ where: { id: screenId } });
    return { ok: true };
  }

  /** Replace all elements of a screen in one transaction (editor autosave). */
  async putElements(ownerId: string, screenId: string, dto: PutElementsDto) {
    await this.assertScreenOwner(ownerId, screenId);
    const rows: Prisma.ElementCreateManyInput[] = dto.elements.map((el) => ({
      screenId,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      zIndex: el.zIndex,
      props: el.props as Prisma.InputJsonValue,
    }));

    await this.prisma.$transaction([
      this.prisma.element.deleteMany({ where: { screenId } }),
      this.prisma.element.createMany({ data: rows }),
    ]);

    return this.prisma.screen.findUnique({
      where: { id: screenId },
      include: { elements: true },
    });
  }

  private async assertProjectOwner(ownerId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    if (project.ownerId !== ownerId) throw new ForbiddenException();
  }

  private async assertScreenOwner(ownerId: string, screenId: string) {
    const screen = await this.prisma.screen.findUnique({
      where: { id: screenId },
      select: { project: { select: { ownerId: true } } },
    });
    if (!screen) throw new NotFoundException('화면을 찾을 수 없습니다.');
    if (screen.project.ownerId !== ownerId) throw new ForbiddenException();
  }
}

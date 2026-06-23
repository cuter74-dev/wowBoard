import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { screens: true } } },
    });
  }

  async create(ownerId: string, dto: CreateProjectDto) {
    // Every new project starts with one default group holding one empty screen.
    const width = dto.width ?? 390;
    const height = dto.height ?? 844;
    const project = await this.prisma.project.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description,
        defaultWidth: width,
        defaultHeight: height,
        groups: { create: { name: '그룹 1', order: 0 } },
      },
      include: { groups: true },
    });
    await this.prisma.screen.create({
      data: {
        projectId: project.id,
        groupId: project.groups[0].id,
        name: '화면 1',
        order: 0,
        width,
        height,
      },
    });
    return this.getOwned(ownerId, project.id);
  }

  /** Fetch a project the user owns, with full screen + element tree + groups. */
  async getOwned(ownerId: string, id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        groups: { orderBy: { order: 'asc' } },
        screens: {
          orderBy: { order: 'asc' },
          include: { elements: true },
        },
      },
    });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    if (project.ownerId !== ownerId) throw new ForbiddenException();
    return project;
  }

  async update(ownerId: string, id: string, dto: UpdateProjectDto) {
    await this.assertOwner(ownerId, id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(ownerId: string, id: string) {
    await this.assertOwner(ownerId, id);
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }

  async assertOwner(ownerId: string, id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    if (project.ownerId !== ownerId) throw new ForbiddenException();
  }
}

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
    // Every new project starts with one empty screen, sized to the project default.
    const width = dto.width ?? 390;
    const height = dto.height ?? 844;
    return this.prisma.project.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description,
        defaultWidth: width,
        defaultHeight: height,
        screens: {
          create: { name: '화면 1', order: 0, width, height },
        },
      },
      include: { screens: true },
    });
  }

  /** Fetch a project the user owns, with full screen + element tree. */
  async getOwned(ownerId: string, id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
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

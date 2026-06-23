import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, projectId: string, dto: CreateGroupDto) {
    await this.assertProjectOwner(ownerId, projectId);
    const count = await this.prisma.screenGroup.count({ where: { projectId } });
    return this.prisma.screenGroup.create({
      data: { projectId, name: dto.name, order: count },
    });
  }

  async update(ownerId: string, id: string, dto: UpdateGroupDto) {
    await this.assertGroupOwner(ownerId, id);
    return this.prisma.screenGroup.update({
      where: { id },
      data: { name: dto.name, order: dto.order },
    });
  }

  async remove(ownerId: string, id: string) {
    await this.assertGroupOwner(ownerId, id);
    // Screens fall back to ungrouped (onDelete: SetNull).
    await this.prisma.screenGroup.delete({ where: { id } });
    return { ok: true };
  }

  private async assertProjectOwner(ownerId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    if (project.ownerId !== ownerId) throw new ForbiddenException();
  }

  private async assertGroupOwner(ownerId: string, id: string) {
    const group = await this.prisma.screenGroup.findUnique({
      where: { id },
      select: { project: { select: { ownerId: true } } },
    });
    if (!group) throw new NotFoundException('그룹을 찾을 수 없습니다.');
    if (group.project.ownerId !== ownerId) throw new ForbiddenException();
  }
}

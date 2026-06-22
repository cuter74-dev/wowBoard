import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class ShareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  /** Enable sharing: create a token if absent, return it. */
  async enable(ownerId: string, projectId: string) {
    await this.projects.assertOwner(ownerId, projectId);
    const existing = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { shareToken: true },
    });
    if (existing?.shareToken) return { shareToken: existing.shareToken };

    const shareToken = randomBytes(16).toString('hex');
    await this.prisma.project.update({
      where: { id: projectId },
      data: { shareToken },
    });
    return { shareToken };
  }

  /** Disable sharing: revoke the token. */
  async disable(ownerId: string, projectId: string) {
    await this.projects.assertOwner(ownerId, projectId);
    await this.prisma.project.update({
      where: { id: projectId },
      data: { shareToken: null },
    });
    return { ok: true };
  }

  /** Public, unauthenticated read-only fetch by share token. */
  async getByToken(token: string) {
    const project = await this.prisma.project.findUnique({
      where: { shareToken: token },
      include: {
        screens: {
          orderBy: { order: 'asc' },
          include: { elements: true },
        },
      },
    });
    if (!project) throw new NotFoundException('공유된 프로젝트를 찾을 수 없습니다.');
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      screens: project.screens,
    };
  }
}

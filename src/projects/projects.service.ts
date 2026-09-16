import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { AddMemberDto } from './dto/add-member.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Creating a project and making the creator its OWNER must happen together,
  // atomically — a project with zero members would be unreachable by anyone.
  create(dto: CreateProjectDto, creatorId: string) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        members: {
          create: { userId: creatorId, role: ProjectRole.OWNER },
        },
      },
      include: { members: true },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  addMember(projectId: string, dto: AddMemberDto) {
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: dto.userId } },
      update: { role: dto.role },
      create: { projectId, userId: dto.userId, role: dto.role },
    });
  }

  removeMember(projectId: string, userId: string) {
    return this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto.js';
import { AssignTaskDto } from './dto/assign-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { AttachLabelDto } from './dto/attach-label.dto.js';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(projectId: string, dto: CreateTaskDto, creatorId: string) {
    if (dto.assigneeId) {
      await this.assertProjectMember(projectId, dto.assigneeId);
    }
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
        projectId,
        creatorId,
      },
    });
  }

  async findAll(projectId: string, query: QueryTaskDto) {
    const where: Prisma.TaskWhereInput = {
      projectId,
      status: query.status,
      priority: query.priority,
      assigneeId: query.assigneeId,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.labelId
        ? { taskLabels: { some: { labelId: query.labelId } } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          taskLabels: { include: { label: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        taskLabels: { include: { label: true } },
        comments: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  updateStatus(id: string, dto: UpdateTaskStatusDto) {
    return this.prisma.task.update({ where: { id }, data: { status: dto.status } });
  }

  async assign(id: string, dto: AssignTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectMember(task.projectId, dto.assigneeId);
    return this.prisma.task.update({ where: { id }, data: { assigneeId: dto.assigneeId } });
  }

  remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  async attachLabel(taskId: string, dto: AttachLabelDto) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const label = await this.prisma.label.findUnique({ where: { id: dto.labelId } });
    if (!label || label.projectId !== task.projectId) {
      throw new ForbiddenException('Label does not belong to this task\'s project');
    }

    return this.prisma.taskLabel.upsert({
      where: { taskId_labelId: { taskId, labelId: dto.labelId } },
      update: {},
      create: { taskId, labelId: dto.labelId },
    });
  }

  detachLabel(taskId: string, labelId: string) {
    return this.prisma.taskLabel.delete({
      where: { taskId_labelId: { taskId, labelId } },
    });
  }

  private async assertProjectMember(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Assignee must be a member of this project');
    }
  }
}

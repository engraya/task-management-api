import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { QueryCommentDto } from './dto/query-comment.dto.js';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(taskId: string, dto: CreateCommentDto, authorId: string) {
    return this.prisma.comment.create({
      data: { body: dto.body, taskId, authorId },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async findAllForTask(taskId: string, query: QueryCommentDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where: { taskId },
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true } } },
      }),
      this.prisma.comment.count({ where: { taskId } }),
    ]);
    return {
      items,
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  remove(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }
}

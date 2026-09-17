import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateLabelDto } from './dto/create-label.dto.js';
import { UpdateLabelDto } from './dto/update-label.dto.js';

@Injectable()
export class LabelsService {
  constructor(private readonly prisma: PrismaService) {}

  create(projectId: string, dto: CreateLabelDto) {
    return this.prisma.label.create({
      data: { name: dto.name, color: dto.color, projectId },
    });
  }

  findAllForProject(projectId: string) {
    return this.prisma.label.findMany({ where: { projectId }, orderBy: { name: 'asc' } });
  }

  update(id: string, dto: UpdateLabelDto) {
    return this.prisma.label.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.label.delete({ where: { id } });
  }
}

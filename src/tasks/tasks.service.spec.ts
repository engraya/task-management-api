import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TasksService', () => {
  let service: TasksService;
  const prismaMock = {
    task: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    projectMember: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(TasksService);
  });

  describe('assign', () => {
    it('throws ForbiddenException when the assignee is not a project member', async () => {
      prismaMock.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
      prismaMock.projectMember.findUnique.mockResolvedValue(null); // not a member

      await expect(
        service.assign('t1', { assigneeId: 'not-a-member' }),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });

    it('assigns the task when the assignee is a project member', async () => {
      prismaMock.task.findUnique.mockResolvedValue({ id: 't1', projectId: 'p1' });
      prismaMock.projectMember.findUnique.mockResolvedValue({ id: 'm1' });
      prismaMock.task.update.mockResolvedValue({ id: 't1', assigneeId: 'u2' });

      const result = await service.assign('t1', { assigneeId: 'u2' });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { assigneeId: 'u2' },
      });
      expect(result.assigneeId).toBe('u2');
    });
  });
});
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { ProjectRole } from '@prisma/client';

export async function createProjectFixture(
  prisma: PrismaService,
  ownerId: string,
  overrides: Partial<{ name: string }> = {},
) {
  return prisma.project.create({
    data: {
      name: overrides.name ?? `Project ${Date.now()}`,
      members: { create: { userId: ownerId, role: ProjectRole.OWNER } },
    },
  });
}

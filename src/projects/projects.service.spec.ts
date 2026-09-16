import { Test } from '@nestjs/testing';
import { ProjectsService } from './projects.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { createUserFixture } from '../../test/fixtures/user.fixture.js';

describe('ProjectsService (integration)', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ProjectsService, PrismaService],
    }).compile();
    service = moduleRef.get(ProjectsService);
    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creating a project also makes the creator its OWNER member', async () => {
    const owner = await createUserFixture(prisma);
    const project = await service.create({ name: 'Integration Test Project' }, owner.id);

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: owner.id } },
    });

    expect(membership?.role).toBe('OWNER');
  });
});

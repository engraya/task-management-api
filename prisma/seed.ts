import { PrismaClient, TaskStatus, TaskPriority, ProjectRole } from '@prisma/client';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
const schema = new URL(connectionString).searchParams.get('schema') ?? 'public';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }, { schema }),
});

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice Owner', passwordHash },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob Member', passwordHash },
  });

  const project = await prisma.project.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Website Relaunch',
      description: 'Rebuild the marketing site',
      members: {
        create: [
          { userId: alice.id, role: ProjectRole.OWNER },
          { userId: bob.id, role: ProjectRole.MEMBER },
        ],
      },
    },
  });

  const bugLabel = await prisma.label.upsert({
    where: { projectId_name: { projectId: project.id, name: 'bug' } },
    update: {},
    create: { projectId: project.id, name: 'bug', color: '#EF4444' },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Set up CI pipeline',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: alice.id,
      },
      {
        title: 'Fix broken checkout button',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: bob.id,
      },
      {
        title: 'Write onboarding docs',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        projectId: project.id,
        creatorId: bob.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete:');
  console.log(`  alice@example.com / password123 (OWNER)`);
  console.log(`  bob@example.com / password123 (MEMBER)`);
  console.log(`  Project: ${project.name} (${project.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

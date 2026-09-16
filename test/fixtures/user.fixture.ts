import { PrismaService } from '../../src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';

export async function createUserFixture(
  prisma: PrismaService,
  overrides: Partial<{ email: string; name: string; password: string }> = {},
) {
  const password = overrides.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, 4); // low rounds — tests don't need production cost
  return prisma.user.create({
    data: {
      email: overrides.email ?? `user-${Date.now()}@example.com`,
      name: overrides.name ?? 'Test User',
      passwordHash,
    },
  });
}
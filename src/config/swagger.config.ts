import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Task & Project Management API')
  .setDescription('A Jira/Trello-style backend built with NestJS + Prisma')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

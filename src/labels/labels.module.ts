import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller.js';
import { LabelsService } from './labels.service.js';
import { ProjectsModule } from '../projects/projects.module.js';

@Module({
  imports: [ProjectsModule], // for ProjectMemberGuard's PrismaService dependency chain
  controllers: [LabelsController],
  providers: [LabelsService],
})
export class LabelsModule {}

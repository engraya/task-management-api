import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LabelsService } from './labels.service.js';
import { CreateLabelDto } from './dto/create-label.dto.js';
import { UpdateLabelDto } from './dto/update-label.dto.js';
import { ProjectMemberGuard } from '../projects/guards/project-member.guard.js';

@ApiTags('labels')
@ApiBearerAuth()
@UseGuards(ProjectMemberGuard)
@Controller('projects/:projectId/labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  create(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: CreateLabelDto) {
    return this.labelsService.create(projectId, dto);
  }

  @Get()
  findAll(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.labelsService.findAllForProject(projectId);
  }

  @Patch(':labelId')
  update(@Param('labelId', ParseUUIDPipe) labelId: string, @Body() dto: UpdateLabelDto) {
    return this.labelsService.update(labelId, dto);
  }

  @Delete(':labelId')
  remove(@Param('labelId', ParseUUIDPipe) labelId: string) {
    return this.labelsService.remove(labelId);
  }
}

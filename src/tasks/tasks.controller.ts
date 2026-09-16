import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto.js';
import { AssignTaskDto } from './dto/assign-task.dto.js';
import { QueryTaskDto } from './dto/query-task.dto.js';
import { AttachLabelDto } from './dto/attach-label.dto.js';
import { ProjectMemberGuard } from '../projects/guards/project-member.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(ProjectMemberGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.create(projectId, dto, user.id);
  }

  @Get()
  findAll(@Param('projectId', ParseUUIDPipe) projectId: string, @Query() query: QueryTaskDto) {
    return this.tasksService.findAll(projectId, query);
  }

  @Get(':taskId')
  findOne(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.tasksService.findOne(taskId);
  }

  @Patch(':taskId')
  update(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(taskId, dto);
  }

  @Patch(':taskId/status')
  updateStatus(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() dto: UpdateTaskStatusDto) {
    return this.tasksService.updateStatus(taskId, dto);
  }

  @Patch(':taskId/assign')
  assign(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() dto: AssignTaskDto) {
    return this.tasksService.assign(taskId, dto);
  }

  @Delete(':taskId')
  remove(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.tasksService.remove(taskId);
  }

  @Post(':taskId/labels')
  attachLabel(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() dto: AttachLabelDto) {
    return this.tasksService.attachLabel(taskId, dto);
  }

  @Delete(':taskId/labels/:labelId')
  detachLabel(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('labelId', ParseUUIDPipe) labelId: string,
  ) {
    return this.tasksService.detachLabel(taskId, labelId);
  }
}

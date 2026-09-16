import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { QueryCommentDto } from './dto/query-comment.dto.js';
import { ProjectMemberGuard } from '../projects/guards/project-member.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(ProjectMemberGuard)
@Controller('projects/:projectId/tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.create(taskId, dto, user.id);
  }

  @Get()
  findAll(@Param('taskId', ParseUUIDPipe) taskId: string, @Query() query: QueryCommentDto) {
    return this.commentsService.findAllForTask(taskId, query);
  }

  @Delete(':commentId')
  remove(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.commentsService.remove(commentId);
  }
}

import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class QueryTaskDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // matches against title/description

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  labelId?: string;
}
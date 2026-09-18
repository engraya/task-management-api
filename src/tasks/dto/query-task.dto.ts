import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class QueryTaskDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'login' })
  search?: string; // matches against title/description

  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiPropertyOptional({ enum: TaskStatus, example: 'TODO' })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  @ApiPropertyOptional({ enum: TaskPriority, example: 'HIGH' })
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid', example: '44444444-4444-4444-8444-444444444444' })
  labelId?: string;
}

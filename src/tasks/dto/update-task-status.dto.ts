import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TaskStatus } from '@prisma/client';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  @ApiProperty({ enum: TaskStatus, example: 'IN_PROGRESS' })
  status: TaskStatus;
}

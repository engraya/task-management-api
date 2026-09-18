import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto.js';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['assigneeId'] as const),
) {}

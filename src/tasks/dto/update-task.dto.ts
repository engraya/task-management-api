import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto.js';

export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['assigneeId'] as const),
) {}

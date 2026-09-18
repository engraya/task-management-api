import { PartialType } from '@nestjs/swagger';
import { CreateLabelDto } from './create-label.dto.js';

export class UpdateLabelDto extends PartialType(CreateLabelDto) {}

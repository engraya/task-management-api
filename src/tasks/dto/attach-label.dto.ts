import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AttachLabelDto {
  @IsUUID()
  @ApiProperty({ format: 'uuid', example: '44444444-4444-4444-8444-444444444444' })
  labelId: string;
}

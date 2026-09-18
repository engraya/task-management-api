import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddMemberDto {
  @IsUUID()
  @ApiProperty({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  userId: string;

  @IsEnum(ProjectRole)
  @ApiProperty({ enum: ProjectRole, example: 'MEMBER' })
  role: ProjectRole;
}

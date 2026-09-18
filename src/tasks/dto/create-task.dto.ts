import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'Build the login page', minLength: 3 })
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Implement the login form and validation messages.' })
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  @ApiPropertyOptional({ enum: TaskPriority, example: 'HIGH' })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ format: 'date-time', example: '2026-12-31T17:00:00.000Z' })
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  assigneeId?: string;
}

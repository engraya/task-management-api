import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'Website redesign', minLength: 3 })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Plan and deliver the new company website.' })
  description?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @ApiPropertyOptional({ example: 'Jane Smith', minLength: 2 })
  name?: string;
}

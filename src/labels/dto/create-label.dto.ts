import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @MinLength(2)
  @ApiProperty({ example: 'Bug', minLength: 2 })
  name: string;

  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional({ example: '#EF4444' })
  color?: string;
}

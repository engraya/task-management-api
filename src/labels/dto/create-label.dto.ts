import { IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
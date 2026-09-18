import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @ApiProperty({ example: 'The implementation is ready for review.', minLength: 1 })
  body: string;
}

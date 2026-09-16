import { IsUUID } from 'class-validator';

export class AttachLabelDto {
  @IsUUID()
  labelId: string;
}

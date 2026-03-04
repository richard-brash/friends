import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PRIORITIES, type Priority } from '../../common/types/domain-types';

export class CreateNeedDto {
  @IsUUID()
  friendId: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(PRIORITIES)
  priority: Priority;
}
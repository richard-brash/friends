import { Priority } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNeedDto {
  @IsUUID()
  friendId: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Priority)
  priority: Priority;
}
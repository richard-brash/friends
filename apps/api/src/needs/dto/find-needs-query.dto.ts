import { NeedStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FindNeedsQueryDto {
  @IsOptional()
  @IsEnum(NeedStatus)
  status?: NeedStatus;
}
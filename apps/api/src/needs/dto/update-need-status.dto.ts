import { NeedStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateNeedStatusDto {
  @IsEnum(NeedStatus)
  status: NeedStatus;
}
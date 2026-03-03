import { IsIn, IsOptional } from 'class-validator';
import { NEED_STATUSES, type NeedStatus } from '../../common/types/domain-types';

export class FindNeedsQueryDto {
  @IsOptional()
  @IsIn(NEED_STATUSES)
  status?: NeedStatus;
}
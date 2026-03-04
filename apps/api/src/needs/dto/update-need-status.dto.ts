import { IsIn } from 'class-validator';
import { NEED_STATUSES, type NeedStatus } from '../../common/types/domain-types';

export class UpdateNeedStatusDto {
  @IsIn(NEED_STATUSES)
  status: NeedStatus;
}
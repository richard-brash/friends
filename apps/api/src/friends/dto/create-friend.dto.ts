import { IsIn, IsOptional, IsString, IsArray } from 'class-validator';
import {
  CONSENT_SCOPES,
  type ConsentScope,
} from '../../common/types/domain-types';

export class CreateFriendDto {
  @IsOptional()
  @IsString()
  preferred_name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @IsOptional()
  @IsString()
  identifying_notes?: string;

  @IsIn(CONSENT_SCOPES)
  consent_scope: ConsentScope;
}

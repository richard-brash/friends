import { IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { ConsentScope } from '@prisma/client';

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

  @IsEnum(ConsentScope)
  consent_scope: ConsentScope;
}

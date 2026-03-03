import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEncounterDto {
  @IsUUID()
  friendId: string;

  @IsOptional()
  @IsString()
  locationText?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
import { IsEmail, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  org_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsNotEmpty()
  password: string;
}

import { IsEmail, IsIn, IsUUID, IsNotEmpty } from 'class-validator';
import { USER_ROLES, type UserRole } from '../../common/types/domain-types';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  org_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsIn(USER_ROLES)
  @IsNotEmpty()
  role: UserRole;

  @IsNotEmpty()
  password: string;
}

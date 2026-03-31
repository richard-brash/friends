import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
  Min,
  Max,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  JWT_SECRET: string;

  // Database connection
  @IsString()
  DATABASE_URL: string;

  @IsString()
  SUPABASE_URL: string;

  @IsOptional()
  @IsString()
  SUPABASE_SERVICE_ROLE_KEY?: string;

  @IsOptional()
  @IsString()
  SUPABASE_INVITE_REDIRECT_URL?: string;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  INVITE_FROM_EMAIL?: string;

  @IsOptional()
  @IsString()
  INVITE_LOGIN_URL?: string;

  @IsOptional()
  @IsString()
  AUTH_ADMIN_EMAILS?: string;

  @IsOptional()
  @IsString()
  DEFAULT_ORGANIZATION_NAME?: string = 'Friend Helper Outreach';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}

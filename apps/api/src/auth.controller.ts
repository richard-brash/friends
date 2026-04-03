import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  buildAccessTokenCookieOptions,
  buildRefreshTokenCookieOptions,
  parseCookieHeader,
} from './auth.constants';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Public } from './common/decorators/public.decorator';
import type { RequestContext } from './common/types/request-context';

class RequestEmailCodeDto {
  @IsEmail()
  email!: string;
}

class VerifyEmailCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(12)
  token!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('request-email-code')
  @HttpCode(200)
  async requestEmailCode(@Body() dto: RequestEmailCodeDto) {
    await this.authService.requestEmailCode(dto.email);
    return { message: 'Code sent.' };
  }

  @Public()
  @Post('verify-email-code')
  @HttpCode(200)
  async verifyEmailCode(
    @Body() dto: VerifyEmailCodeDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyEmailCode(dto.email, dto.token);

    this.applySessionCookies(
      response,
      result.accessToken,
      result.refreshToken,
      result.expiresIn,
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refreshSession(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = parseCookieHeader(request.headers.cookie);
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE]?.trim();

    if (!refreshToken) {
      throw new BadRequestException('Missing refresh token');
    }

    const result = await this.authService.refreshSession(refreshToken);
    this.applySessionCookies(
      response,
      result.accessToken,
      result.refreshToken,
      result.expiresIn,
    );

    return {
      ok: true,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookies = parseCookieHeader(request.headers.cookie);
    const accessToken = cookies[ACCESS_TOKEN_COOKIE]?.trim() || null;

    await this.authService.logout(accessToken);
    this.clearSessionCookies(response);

    return { ok: true };
  }

  @Get('me')
  async getAuthenticatedUser(@CurrentUser() user: RequestContext) {
    return this.authService.getCurrentUser(user.userId);
  }

  private applySessionCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
    expiresInSeconds: number,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      accessToken,
      buildAccessTokenCookieOptions(isProduction, expiresInSeconds),
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      buildRefreshTokenCookieOptions(isProduction),
    );
  }

  private clearSessionCookies(response: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    response.clearCookie(
      ACCESS_TOKEN_COOKIE,
      buildAccessTokenCookieOptions(isProduction),
    );
    response.clearCookie(
      REFRESH_TOKEN_COOKIE,
      buildRefreshTokenCookieOptions(isProduction),
    );
  }
}

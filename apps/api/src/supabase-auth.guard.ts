import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_TOKEN_COOKIE, parseCookieHeader } from './auth.constants';
import { IS_PUBLIC_KEY } from './common/decorators/public.decorator';
import { AuthService } from './auth.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: unknown;
    }>();
    const authorization =
      request.headers.authorization ?? request.headers.Authorization;
    const cookies = parseCookieHeader(request.headers.cookie);

    if (!authorization || !authorization.startsWith('Bearer ')) {
      const cookieToken = cookies[ACCESS_TOKEN_COOKIE]?.trim();

      if (!cookieToken) {
        throw new UnauthorizedException('Missing authentication token');
      }

      request.user =
        await this.authService.authenticateAccessToken(cookieToken);
      return true;
    }

    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    request.user = await this.authService.authenticateAccessToken(token);
    return true;
  }
}

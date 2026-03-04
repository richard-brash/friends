import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../types/request-context';

/**
 * Decorator to extract authenticated user context from request
 * Usage: getUser(@CurrentUser() user: RequestContext)
 *
 * Requires JWT authentication guard to populate request.user
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

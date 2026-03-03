import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Protects routes by requiring valid JWT token
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('protected')
 *   protectedRoute() { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

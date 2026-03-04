import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestContext } from '../../common/types/request-context';

/**
 * JWT Strategy for validating JWT tokens
 * Per MVP-Architecture.md Section 3: "JWT with org_id and role"
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Validates JWT payload and returns user context
   * Payload contains: userId, orgId, role
   */
  async validate(payload: any): Promise<RequestContext> {
    return {
      userId: payload.sub,
      orgId: payload.orgId,
      role: payload.role,
    };
  }
}

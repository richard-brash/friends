import type { UserRole } from './domain-types';

/**
 * Request context extracted from JWT payload
 * Per MVP-Architecture.md Section 3: "JWT with org_id and role"
 */
export interface RequestContext {
  userId: string;
  orgId: string;
  role: UserRole;
}

/**
 * Extended Express Request with authenticated user context
 */
export interface RequestWithUser extends Request {
  user: RequestContext;
}
